import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';
import {supabase} from '../../lib/supabase';
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
    type InsuranceHistory, Item,
} from '../../lib/services';
import {useAuth} from './AuthContext';

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
    //items
    items: Item[];
    list
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
    addInsuranceHistory: (record: Omit<InsuranceHistory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateInsuranceHistory: (id: string, record: Partial<Omit<InsuranceHistory, 'id' | 'carId' | 'createdAt'>>) => Promise<void>;
    deleteInsuranceHistory: (id: string) => Promise<void>;
    t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Tiny id generator for in-memory preview records.
function previewId() {
    return `preview-${Math.random().toString(36).slice(2, 10)}`;
}


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {isPreviewMode} = useAuth();

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
        if (isPreviewMode) {
            setServicesLoading(false);
            return;
        }
        try {
            const [svc, rem] = await Promise.all([
                servicesService.listByCars(carIds),
                remindersService.listByCars(carIds),
            ]);
            setServices(svc);
            setReminders(rem);
        } catch { /* errors logged inside service */
        } finally {
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
                            ? {
                                insuranceStartDate: latestInsurance.fromDate ?? undefined,
                                insuranceEndDate: latestInsurance.toDate ?? undefined
                            }
                            : {}),
                        ...(latestInspection
                            ? {
                                technicalInspectionStartDate: latestInspection.fromDate ?? undefined,
                                technicalInspectionEndDate: latestInspection.toDate ?? undefined
                            }
                            : {}),
                    };
                })
            );
        } catch { /* errors logged inside services */
        }
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
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event) => {
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
            setCars((prev) => [...prev, {...car, id}]);
            carIdsRef.current = [...carIdsRef.current, id];
            return;
        }
        await carsService.create(car);
        await loadCars();
    };

    const updateCar = async (id: string, changes: Partial<Car>): Promise<void> => {
        if (isPreviewMode) {
            setCars((prev) => prev.map((c) => (c.id === id ? {...c, ...changes} : c)));
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
            setServices((prev) => [{...service, id: previewId()}, ...prev]);
            return;
        }
        await servicesService.create(service);
        await loadServicesAndReminders(carIdsRef.current);
    };

    const updateService = async (id: string, service: Omit<Service, 'id'>): Promise<void> => {
        if (isPreviewMode) {
            setServices((prev) => prev.map((s) => (s.id === id ? {...service, id} : s)));
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
            setReminders((prev) => [{...reminder, id: previewId()}, ...prev]);
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
            setInspectionHistories((prev) => [{
                ...record,
                id: previewId(),
                createdAt: new Date().toISOString()
            }, ...prev]);
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
            setInspectionHistories((prev) => prev.map((h) => (h.id === id ? {...h, ...record} : h)));
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

    const addInsuranceHistory = async (
        record: Omit<InsuranceHistory, 'id' | 'createdAt'>
    ): Promise<void> => {
        if (isPreviewMode) {
            setInsuranceHistories((prev) => [
                {
                    ...record,
                    id: previewId(),
                    createdAt: new Date().toISOString(),
                },
                ...prev,
            ]);
            return;
        }

        console.log('ADDING INSURANCE:', record);
        console.log('CURRENT CAR IDS:', carIdsRef.current);

        await insuranceHistoriesService.create(record);

        console.log('INSURANCE CREATED');

        await loadHistories(carIdsRef.current);

        console.log('HISTORIES RELOADED');
    };

    const updateInsuranceHistory = async (
        id: string,
        record: Partial<Omit<InsuranceHistory, 'id' | 'carId' | 'createdAt'>>,
    ): Promise<void> => {
        if (isPreviewMode) {
            setInsuranceHistories((prev) => prev.map((h) => (h.id === id ? {...h, ...record} : h)));
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
