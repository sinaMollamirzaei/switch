import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  carsService,
  servicesService,
  remindersService,
  inspectionHistoriesService,
  insuranceHistoriesService,
  type Car,
  type Service,
  type Reminder,
  type InspectionHistory,
  type InsuranceHistory,
} from '../../lib/services';
import { useAuth } from './AuthContext';
import { addInsuranceWorkflow, addInspectionWorkflow } from '../../lib/workflows';

export type Language = 'en' | 'fa';
export type Theme = 'light' | 'dark';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  // Cars
  cars: Car[];
  carsLoading: boolean;
  addCar: (car: Omit<Car, 'id'>) => Promise<void>;
  updateCar: (id: string, car: Partial<Car>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  // Services
  services: Service[];
  servicesLoading: boolean;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Omit<Service, 'id'>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  // Inspection histories
  inspectionHistories: InspectionHistory[];
  addInspectionHistory: (record: Omit<InspectionHistory, 'id' | 'createdAt'>) => Promise<void>;
  updateInspectionHistory: (id: string, record: Partial<Omit<InspectionHistory, 'id' | 'carId' | 'createdAt'>>) => Promise<void>;
  deleteInspectionHistory: (id: string) => Promise<void>;
  // Insurance histories
  insuranceHistories: InsuranceHistory[];
  addInsuranceHistory: (record: Omit<InsuranceHistory, 'id' | 'createdAt'>) => Promise<void>;
  updateInsuranceHistory: (id: string, record: Partial<Omit<InsuranceHistory, 'id' | 'carId' | 'createdAt'>>) => Promise<void>;
  deleteInsuranceHistory: (id: string) => Promise<void>;
  t: (key: string) => string;
}

// ── Translations ──────────────────────────────────────────────────────────────
const translations = {
  en: {
    dashboard: 'Dashboard', addService: 'Add Service', cars: 'Cars', insights: 'Insights',
    profile: 'Profile', settings: 'Settings', manageCars: 'Manage Cars',
    upcomingServices: 'Upcoming Services', serviceHistory: 'Service History',
    viewAll: 'View All', at: 'At', in: 'In', km: 'km', days: 'days',
    engine: 'Engine', gearbox: 'Gearbox', brakes: 'Brakes', tires: 'Tires',
    battery: 'Battery', general: 'General',
    selectCar: 'Select Car', selectServiceType: 'Select Service Type',
    serviceDate: 'Service Date', carMileage: 'Car Mileage (km)',
    serviceCost: 'Service Cost', notes: 'Notes / Description',
    nextServiceReminder: 'Next Service Reminder', reminderType: 'Reminder Type',
    byDate: 'By Date', byMileage: 'By Kilometers',
    reminderNote: 'Reminder Note (Optional)',
    save: 'Save', cancel: 'Cancel', nextStep: 'Next Step',
    skipReminder: 'Skip Reminder',
    recordCompletedService: 'Record Completed Service',
    recordReminderOnly: 'Only Record Reminder',
    selectServiceItems: 'Select Service Items',
    serviceItemsOptional: 'Select what was serviced (Optional)',
    addCustomItem: 'Add Custom Item',
    customItemPlaceholder: 'Enter custom service item', skipItems: 'Skip',
    engineOil: 'Engine Oil', oilFilter: 'Oil Filter', airFilter: 'Air Filter',
    cabinFilter: 'Cabin Filter', brakePads: 'Brake Pads', gearboxOil: 'Gearbox Oil',
    gearboxFilter: 'Gearbox Filter', batteryReplacement: 'Battery Replacement',
    tirePressure: 'Tire Pressure Check', coolant: 'Coolant', acGas: 'AC Gas',
    washerFluid: 'Washer Fluid', suspension: 'Suspension', timingBelt: 'Timing Belt',
    exhaust: 'Exhaust System', powerSteeringFluid: 'Power Steering Fluid',
    addNewCar: 'Add New Car', carName: 'Car Name', licensePlate: 'License Plate',
    edit: 'Edit', delete: 'Delete', insurance: 'Insurance',
    technicalInspection: 'Technical Inspection', from: 'From', to: 'To',
    addDates: 'Add Dates', expired: 'Expired', daysRemaining: 'days remaining',
    lightMode: 'Light Mode', darkMode: 'Dark Mode', language: 'Language',
    english: 'English', persian: 'فارسی', settingsDescription: 'Manage your app preferences',
    phoneNumber: 'Phone Number', exportReport: 'Export Service Report',
    cost: 'Cost', mileage: 'Mileage', noServices: 'No services recorded yet',
    noCars: 'No cars added yet',
    serviceHistoryDescription: 'View and export all your service records',
    endOfHistory: 'End of History', serviceItems: 'Service Items', startService: 'Start',
    insightsSubtitle: 'Learn about car maintenance and safe driving',
    pleaseFillAllFields: 'Please fill in all fields', savedSuccessfully: 'Saved successfully!',
    account: 'Account',
  },
  fa: {
    dashboard: 'داشبورد', addService: 'افزودن سرویس', cars: 'خودروها', insights: 'آموزش',
    profile: 'پروفایل', settings: 'تنظیمات', manageCars: 'مدیریت خودروها',
    upcomingServices: 'سرویس‌های پیش‌رو', serviceHistory: 'تاریخچه سرویس',
    viewAll: 'مشاهده همه', at: 'در', in: 'در', km: 'کیلومتر', days: 'روز',
    engine: 'موتور', gearbox: 'گیربکس', brakes: 'ترمز', tires: 'لاستیک',
    battery: 'باتری', general: 'عمومی',
    selectCar: 'انتخاب خودرو', selectServiceType: 'انتخاب نوع سرویس',
    serviceDate: 'تاریخ سرویس', carMileage: 'کیلومتر خودرو',
    serviceCost: 'هزینه سرویس', notes: 'یادداشت / توضیحات',
    nextServiceReminder: 'یادآوری سرویس بعدی', reminderType: 'نوع یادآوری',
    byDate: 'بر اساس تاریخ', byMileage: 'بر اساس کیلومتر',
    reminderNote: 'یادداشت یادآوری (اختیاری)',
    save: 'ذخیره', cancel: 'لغو', nextStep: 'مرحله بعد',
    skipReminder: 'رد کردن یادآوری',
    recordCompletedService: 'ثبت سرویس انجام‌شده',
    recordReminderOnly: 'فقط ثبت یادآوری',
    selectServiceItems: 'انتخاب موارد سرویس',
    serviceItemsOptional: 'انتخاب موارد سرویس شده (اختیاری)',
    addCustomItem: 'افزودن مورد سفارشی',
    customItemPlaceholder: 'مورد سفارشی خود را وارد کنید', skipItems: 'رد کردن',
    engineOil: 'روغن موتور', oilFilter: 'فیلتر روغن', airFilter: 'فیلتر هوا',
    cabinFilter: 'فیلتر کابین', brakePads: 'لنت ترمز', gearboxOil: 'روغن گیربکس',
    gearboxFilter: 'فیلتر گیربکس', batteryReplacement: 'تعویض باتری',
    tirePressure: 'بررسی فشار لاستیک', coolant: 'مایع خنک‌کننده', acGas: 'گاز کولر',
    washerFluid: 'مایع شیشه‌شوی', suspension: 'سیستم تعلیق', timingBelt: 'تسمه تایم',
    exhaust: 'سیستم اگزوز', powerSteeringFluid: 'روغن فرمان',
    addNewCar: 'افزودن خودرو جدید', carName: 'نام خودرو', licensePlate: 'پلاک',
    edit: 'ویرایش', delete: 'حذف', insurance: 'بیمه',
    technicalInspection: 'معاینه فنی', from: 'از', to: 'تا',
    addDates: 'افزودن تاریخ‌ها', expired: 'منقضی شده', daysRemaining: 'روز مانده',
    lightMode: 'حالت روشن', darkMode: 'حالت تاریک', language: 'زبان',
    english: 'English', persian: 'فارسی', settingsDescription: 'مدیریت تنظیمات برنامه',
    phoneNumber: 'شماره تماس', exportReport: 'خروجی گزارش سرویس',
    cost: 'هزینه', mileage: 'کیلومتر', noServices: 'هنوز سرویسی ثبت نشده است',
    noCars: 'هنوز خودرویی اضافه نشده است',
    serviceHistoryDescription: 'مشاهده و خروجی تمام رکوردهای سرویس',
    endOfHistory: 'پایان تاریخچه', serviceItems: 'موارد سرویس', startService: 'شروع',
    insightsSubtitle: 'یاد بگیرید درباره نگهداری و رانندگی ایمن',
    pleaseFillAllFields: 'لطفاً تمام فیلدها را پر کنید',
    savedSuccessfully: 'با موفقیت ذخیره شد!',
    account: 'حساب کاربری',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Tiny id generator for in-memory preview records.
function previewId() {
  return `preview-${Math.random().toString(36).slice(2, 10)}`;
}


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPreviewMode } = useAuth();

  const [language, setLanguage] = useState<Language>('fa');
  const [theme, setTheme] = useState<Theme>('light');

  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [inspectionHistories, setInspectionHistories] = useState<InspectionHistory[]>([]);
  const [insuranceHistories, setInsuranceHistories] = useState<InsuranceHistory[]>([]);

  // Stable ref to current car IDs so mutations don't capture stale closures.
  const carIdsRef = useRef<string[]>([]);

  // ── Load helpers ─────────────────────────────────────────────────────────────

  const loadCars = useCallback(async (): Promise<string[]> => {
    if (isPreviewMode) {
      setCarsLoading(false);
      return carIdsRef.current;
    }
    try {
      const loaded = await carsService.list();
      setCars(loaded);
      const ids = loaded.map((c) => c.id);
      carIdsRef.current = ids;
      return ids;
    } catch {
      setCars([]);
      carIdsRef.current = [];
      return [];
    } finally {
      setCarsLoading(false);
    }
  }, [isPreviewMode]);

  const loadServicesAndReminders = useCallback(async (carIds: string[]) => {
    if (isPreviewMode) { setServicesLoading(false); return; }
    try {
      const [svc, rem] = await Promise.all([
        servicesService.listByCars(carIds),
        remindersService.listByCars(carIds),
      ]);
      setServices(svc);
      setReminders(rem);
    } catch { /* errors logged inside service */ } finally {
      setServicesLoading(false);
    }
  }, [isPreviewMode]);

  const loadHistories = useCallback(async (carIds: string[]) => {
    if (isPreviewMode || carIds.length === 0) return;
    try {
      const [inspectionResults, insuranceResults] = await Promise.all([
        Promise.all(carIds.map((id) => inspectionHistoriesService.listByCar(id))),
        Promise.all(carIds.map((id) => insuranceHistoriesService.listByCar(id))),
      ]);
      const allInspections = inspectionResults.flat();
      const allInsurances = insuranceResults.flat();
      setInspectionHistories(allInspections);
      setInsuranceHistories(allInsurances);

      // Merge the most recent history record's dates onto each car so that
      // car.insuranceStartDate / car.technicalInspectionStartDate etc. survive page refreshes.
      setCars((prev) =>
        prev.map((car) => {
          const latestInsurance = allInsurances
            .filter((h) => h.carId === car.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          const latestInspection = allInspections
            .filter((h) => h.carId === car.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          return {
            ...car,
            ...(latestInsurance
              ? { insuranceStartDate: latestInsurance.startDate ?? undefined, insuranceEndDate: latestInsurance.endDate ?? undefined }
              : {}),
            ...(latestInspection
              ? { technicalInspectionStartDate: latestInspection.startDate ?? undefined, technicalInspectionEndDate: latestInspection.endDate ?? undefined }
              : {}),
          };
        })
      );
    } catch { /* errors logged inside services */ }
  }, [isPreviewMode]);

  const loadAll = useCallback(async () => {
    setCarsLoading(true);
    setServicesLoading(true);
    const carIds = await loadCars();
    await Promise.all([
      loadServicesAndReminders(carIds),
      loadHistories(carIds),
    ]);
  }, [loadCars, loadServicesAndReminders, loadHistories]);

  useEffect(() => {
    if (isPreviewMode) {
      setCarsLoading(false);
      setServicesLoading(false);
      return;
    }
    loadAll();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        loadAll();
      }
    });
    return () => subscription.unsubscribe();
  }, [isPreviewMode, loadAll]);

  // ── Theme / language ─────────────────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ── Cars ─────────────────────────────────────────────────────────────────────

  const addCar = async (car: Omit<Car, 'id'>): Promise<void> => {
    if (isPreviewMode) {
      const id = previewId();
      setCars((prev) => [...prev, { ...car, id }]);
      carIdsRef.current = [...carIdsRef.current, id];
      return;
    }
    await carsService.create(car);
    await loadCars();
  };

  const updateCar = async (id: string, changes: Partial<Car>): Promise<void> => {
    if (isPreviewMode) {
      setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
      return;
    }

    const wrote = await carsService.update(id, changes);
    if (wrote) await loadCars();
  };

  const deleteCar = async (id: string): Promise<void> => {
    if (isPreviewMode) {
      setCars((prev) => prev.filter((c) => c.id !== id));
      setServices((prev) => prev.filter((s) => s.carId !== id));
      setReminders((prev) => prev.filter((r) => r.carId !== id));
      setInspectionHistories((prev) => prev.filter((h) => h.carId !== id));
      setInsuranceHistories((prev) => prev.filter((h) => h.carId !== id));
      carIdsRef.current = carIdsRef.current.filter((cid) => cid !== id);
      return;
    }
    await carsService.remove(id);
    await loadAll();
  };

  // ── Services ──────────────────────────────────────────────────────────────────

  const addService = async (service: Omit<Service, 'id'>): Promise<void> => {
    if (isPreviewMode) {
      setServices((prev) => [{ ...service, id: previewId() }, ...prev]);
      return;
    }
    await servicesService.create(service);
    await loadServicesAndReminders(carIdsRef.current);
  };

  const updateService = async (id: string, service: Omit<Service, 'id'>): Promise<void> => {
    if (isPreviewMode) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...service, id } : s)));
      return;
    }
    await servicesService.update(id, service);
    await loadServicesAndReminders(carIdsRef.current);
  };

  const deleteService = async (id: string): Promise<void> => {
    if (isPreviewMode) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    await servicesService.remove(id);
    await loadServicesAndReminders(carIdsRef.current);
  };

  // ── Reminders ─────────────────────────────────────────────────────────────────

  const addReminder = async (reminder: Omit<Reminder, 'id'>): Promise<void> => {
    if (isPreviewMode) {
      setReminders((prev) => [{ ...reminder, id: previewId() }, ...prev]);
      return;
    }
    await remindersService.create(reminder);
    await loadServicesAndReminders(carIdsRef.current);
  };

  const deleteReminder = async (id: string): Promise<void> => {
    if (isPreviewMode) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    await remindersService.remove(id);
    await loadServicesAndReminders(carIdsRef.current);
  };

  // ── Inspection histories ──────────────────────────────────────────────────────

  const addInspectionHistory = async (record: Omit<InspectionHistory, 'id' | 'createdAt'>): Promise<void> => {
    if (isPreviewMode) {
      setInspectionHistories((prev) => [{ ...record, id: previewId(), createdAt: new Date().toISOString() }, ...prev]);
      return;
    }
    await inspectionHistoriesService.create(record);
    await loadHistories(carIdsRef.current);
  };

  const updateInspectionHistory = async (
    id: string,
    record: Partial<Omit<InspectionHistory, 'id' | 'carId' | 'createdAt'>>,
  ): Promise<void> => {
    if (isPreviewMode) {
      setInspectionHistories((prev) => prev.map((h) => (h.id === id ? { ...h, ...record } : h)));
      return;
    }
    await inspectionHistoriesService.update(id, record);
    await loadHistories(carIdsRef.current);
  };

  const deleteInspectionHistory = async (id: string): Promise<void> => {
    if (isPreviewMode) {
      setInspectionHistories((prev) => prev.filter((h) => h.id !== id));
      return;
    }
    await inspectionHistoriesService.remove(id);
    await loadHistories(carIdsRef.current);
  };

  // ── Insurance histories ────────────────────────────────────────────────────────

  const addInsuranceHistory = async (record: Omit<InsuranceHistory, 'id' | 'createdAt'>): Promise<void> => {
    if (isPreviewMode) {
      setInsuranceHistories((prev) => [{ ...record, id: previewId(), createdAt: new Date().toISOString() }, ...prev]);
      return;
    }
    await insuranceHistoriesService.create(record);
    await loadHistories(carIdsRef.current);
  };

  const updateInsuranceHistory = async (
    id: string,
    record: Partial<Omit<InsuranceHistory, 'id' | 'carId' | 'createdAt'>>,
  ): Promise<void> => {
    if (isPreviewMode) {
      setInsuranceHistories((prev) => prev.map((h) => (h.id === id ? { ...h, ...record } : h)));
      return;
    }
    await insuranceHistoriesService.update(id, record);
    await loadHistories(carIdsRef.current);
  };

  const deleteInsuranceHistory = async (id: string): Promise<void> => {
    if (isPreviewMode) {
      setInsuranceHistories((prev) => prev.filter((h) => h.id !== id));
      return;
    }
    await insuranceHistoriesService.remove(id);
    await loadHistories(carIdsRef.current);
  };

  // ── i18n ──────────────────────────────────────────────────────────────────────

  const t = (key: string): string =>
    translations[language][key as keyof typeof translations['en']] || key;

  return (
    <AppContext.Provider
      value={{
        language, setLanguage,
        theme, setTheme,
        cars, carsLoading, addCar, updateCar, deleteCar,
        services, servicesLoading, addService, updateService, deleteService,
        reminders, addReminder, deleteReminder,
        inspectionHistories, addInspectionHistory, updateInspectionHistory, deleteInspectionHistory,
        insuranceHistories, addInsuranceHistory, updateInsuranceHistory, deleteInsuranceHistory,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
