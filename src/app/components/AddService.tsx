import React, {useState, useEffect} from 'react';
import {useApp} from '../context/AppContext';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {NumericInput} from './ui/numeric-input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';
import {toast} from 'sonner';
import {ChevronLeft, CircleCheck, Check, Plus} from 'lucide-react';
import {DatePickerInput} from './ui/date-picker';
import {motion, AnimatePresence} from 'motion/react';
import {Reminder, Service, Item} from "../../lib/services";

interface AddServiceProps {
    onSuccess?: () => void;
    reminderServiceId?: string | null;
    editingServiceId?: string | null;
}

export const AddService: React.FC<AddServiceProps> = ({onSuccess, reminderServiceId, editingServiceId}) => {
    const {t, cars, addService, updateService, addReminder, language, items, services} = useApp();
    const [step, setStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [customItem, setCustomItem] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [mode, setMode] = useState<'completed' | 'reminder'>('completed');
    const [serviceFormData, setServiceFormData] = useState<Partial<Omit<Service, 'id'>>>(({
        carId: '',
        itemId: '',
        date: new Date().toISOString().split('T')[0],
        kilometer: 0,
        cost: 0,
        description: '',
    }));
    const [reminderFormData, setReminderFormData] = useState<Partial<Omit<Reminder, 'id'>>>(({
        carId: '',
        itemId: '',
        targetDate: new Date().toISOString().split('T')[0],
        targetKilometer: 0,
        description: '',
    }));


    // Pre-fill data from reminder service
    useEffect(() => {
        if (reminderServiceId) {
            const reminderService = services.find(s => s.id === reminderServiceId);
            if (reminderService) {
                setServiceFormData({
                    carId: reminderService.carId,
                    itemId: reminderService.itemId,
                    date: new Date().toISOString().split('T')[0],
                    kilometer: 0,
                    cost: 0,
                    description: '',
                });
                setMode('completed');
                setStep(3); // Skip mode selection and car/type (pre-filled)
            }
        }
    }, [reminderServiceId, services]);

    // Pre-fill data from editing service
    useEffect(() => {
        if (editingServiceId) {
            const editingService = services.find(s => s.id === editingServiceId);
            if (editingService) {
                setServiceFormData({
                    carId: editingService.carId,
                    date: editingService.date,
                    kilometer: editingService.kilometer,
                    cost: editingService.cost,
                    description: editingService.description,
                });
                setSelectedItems(editingService.serviceItems || []);
                setMode('completed');
                setStep(3); // Skip mode selection and car/type (pre-filled)
            }
        }
    }, [editingServiceId, services]);

    // Reset selected items when service type changes
    useEffect(() => {
        setSelectedItems([]);
        setShowCustomInput(false);
        setCustomItem('');
    }, [serviceFormData.type]);

    const toggleItem = (item: string) => {
        setSelectedItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const addCustomServiceItem = () => {
        if (customItem.trim()) {
            setSelectedItems(prev => [...prev, customItem.trim()]);
            setCustomItem('');
            setShowCustomInput(false);
        }
    };

    const resetForm = () => {
        setServiceFormData({
            carId: '',
            date: new Date().toISOString().split('T')[0],
            kilometer: 0,
            cost: 0,
            description: '',
        });
        setStep(1);
        setMode('completed');
    };

    const handleSubmit = async () => {
        try {
            if (editingServiceId) {
                await updateService(editingServiceId, serviceFormData as Omit<Service, 'id'>);
            } else {
                await addService(serviceFormData as Omit<Service, 'id'>);
            }
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                resetForm();
                if (onSuccess) onSuccess();
            }, 1000);
        } catch {
            toast.error('Failed to save service. Please try again.');
        }
    };

    const handleReminderSubmit = async () => {
        try {
            await addReminder({
                carId: reminderFormData.carId!,
                itemId: reminderFormData.itemId,
                targetDate: reminderFormData.targetDate,
                targetKilometer: reminderFormData.targetKilometer,
                description: reminderFormData.description,
            });
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                resetForm();
                if (onSuccess) onSuccess();
            }, 1000);
        } catch {
            toast.error('Failed to save reminder. Please try again.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/70">
                <div className="relative flex items-center justify-center px-4 py-4">
                    {/* Back button - positioned at start (left for LTR, right for RTL) */}
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="absolute start-4 h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                        >
                            <ChevronLeft className={`h-5 w-5 ${language === 'fa' ? 'rotate-180' : ''}`}/>
                        </button>
                    )}
                    {/* Title - always centered */}
                    <h1 className="text-foreground font-semibold">{t('addService')}</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="max-w-md mx-auto space-y-6">
                    {/* Step 1: Mode Selection (Only show when not editing/from reminder) */}
                    {step === 1 && !editingServiceId && !reminderServiceId && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium text-foreground mb-2">{language === 'fa' ? 'نوع ثبت' : 'Record Type'}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {language === 'fa'
                                        ? 'لطفاً نوع ثبت را انتخاب کنید'
                                        : 'Please select the type of record'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setMode('completed');
                                        setStep(2);
                                    }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                        mode === 'completed'
                                            ? 'bg-primary/10 border-primary text-foreground'
                                            : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                    }`}
                                >
                                    <div
                                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            mode === 'completed' ? 'border-primary' : 'border-border/70'
                                        }`}>
                                        {mode === 'completed' && <div className="h-3 w-3 rounded-full bg-primary"/>}
                                    </div>
                                    <div className="flex-1 text-start">
                                        <div className="font-medium">{t('recordCompletedService')}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {language === 'fa' ? 'ثبت اطلاعات سرویس انجام شده' : 'Record completed service details'}
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setMode('reminder');
                                        setStep(2);
                                    }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                        mode === 'reminder'
                                            ? 'bg-primary/10 border-primary text-foreground'
                                            : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                    }`}
                                >
                                    <div
                                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            mode === 'reminder' ? 'border-primary' : 'border-border/70'
                                        }`}>
                                        {mode === 'reminder' && <div className="h-3 w-3 rounded-full bg-primary"/>}
                                    </div>
                                    <div className="flex-1 text-start">
                                        <div className="font-medium">{t('recordReminderOnly')}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {language === 'fa' ? 'فقط ثبت یادآوری برای سرویس آتی' : 'Only record a reminder for future service'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Car and item Type */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="car">{t('selectCar')}</Label>
                                <select
                                    id="car"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-secondary border border-border/70 text-foreground"
                                    value={serviceFormData.carId}
                                    onChange={(e) => setServiceFormData({...serviceFormData, carId: e.target.value})}
                                >
                                    <option value="">{t('selectCar')}</option>
                                    {cars.map(car => (
                                        <option key={car.id} value={car.id}>
                                            {car.name} - {car.plate}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label>{t('selectItem')}</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {services.map(service => (
                                        <button
                                            key={service}
                                            onClick={() => setServiceFormData({...serviceFormData})}
                                            className={`py-3 px-4 rounded-xl border transition-all ${
                                                serviceFormData.itemId === service.id
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                            }`}
                                        >
                                            {t(service)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={() => setStep(3)}
                                disabled={!serviceFormData.carId}
                                className="w-full bg-primary hover:bg-primary/90"
                            >
                                {t('nextStep')}
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Service Items OR Reminder (based on mode) */}
                    {step === 3 && mode === 'reminder' && (
                        <div className="space-y-6">
                            <h3 className="font-medium">{t('nextServiceReminder')}</h3>

                            <div>
                                <Label>{t('reminderType')}</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <button
                                        onClick={() => setServiceFormData({
                                            ...serviceFormData
                                        })}
                                        className={`py-3 px-4 rounded-xl border transition-all ${
                                            serviceFormData.nextServiceType === 'date'
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        {t('byDate')}
                                    </button>
                                    <button
                                        onClick={() => setServiceFormData({
                                            ...serviceFormData,
                                            nextServiceType: 'mileage',
                                            nextServiceValue: 0
                                        })}
                                        className={`py-3 px-4 rounded-xl border transition-all ${
                                            serviceFormData.nextServiceType === 'mileage'
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        {t('byMileage')}
                                    </button>
                                </div>
                            </div>

                            {serviceFormData.nextServiceType === 'date' && (
                                <div>
                                    <Label htmlFor="nextDate">{t('serviceDate')}</Label>
                                    <DatePickerInput
                                        value={serviceFormData.nextServiceValue as string}
                                        onChange={(date) => setServiceFormData({...serviceFormData, nextServiceValue: date})}
                                        language={language}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {serviceFormData.nextServiceType === 'mileage' && (
                                <div>
                                    <Label htmlFor="nextMileage">{t('carMileage')}</Label>
                                    <NumericInput
                                        id="nextMileage"
                                        value={serviceFormData.nextServiceValue as number}
                                        onChange={(value) => setServiceFormData({...serviceFormData, nextServiceValue: value})}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {serviceFormData.nextServiceType && (
                                <div>
                                    <Label htmlFor="reminderNote">{t('reminderNote')}</Label>
                                    <Textarea
                                        id="reminderNote"
                                        value={serviceFormData.reminderNote}
                                        onChange={(e) => setServiceFormData({...serviceFormData, reminderNote: e.target.value})}
                                        className="mt-2"
                                        rows={2}
                                        placeholder={language === 'fa' ? 'مثلاً: تعویض روغن و فیلتر' : 'e.g., Oil change and filter'}
                                    />
                                </div>
                            )}

                            <Button
                                onClick={handleReminderSubmit}
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={!serviceFormData.nextServiceType || !serviceFormData.nextServiceValue}
                            >
                                {t('save')}
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Service Items (only for completed mode) */}
                    {step === 3 && mode === 'completed' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium text-foreground mb-1">{t('selectServiceItems')}</h3>
                                <p className="text-sm text-muted-foreground">{t('serviceItemsOptional')}</p>
                            </div>

                            {/* Predefined Items */}
                            <div className="space-y-2">
                                {serviceItemsMap[serviceFormData.type || 'general'].map((item) => {
                                    const isSelected = selectedItems.includes(item);
                                    return (
                                        <button
                                            key={item}
                                            onClick={() => toggleItem(item)}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                                isSelected
                                                    ? 'bg-primary/10 border-primary text-foreground'
                                                    : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                            }`}
                                        >
                                            <div
                                                className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                                    isSelected ? 'bg-primary border-primary' : 'border-border/70'
                                                }`}>
                                                {isSelected && <Check className="h-3 w-3 text-primary-foreground"
                                                                      strokeWidth={3}/>}
                                            </div>
                                            <span className="flex-1 text-start">{t(item)}</span>
                                        </button>
                                    );
                                })}

                                {/* Custom Items Display */}
                                {selectedItems.filter(item => !serviceItemsMap[serviceFormData.type || 'general'].includes(item)).map((customItemText) => (
                                    <button
                                        key={customItemText}
                                        onClick={() => toggleItem(customItemText)}
                                        className="w-full flex items-center gap-3 p-4 rounded-xl border transition-all bg-primary/10 border-primary text-foreground"
                                    >
                                        <div
                                            className="h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-colors bg-primary border-primary">
                                            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3}/>
                                        </div>
                                        <span className="flex-1 text-start">{customItemText}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Add Custom Item */}
                            {!showCustomInput ? (
                                <button
                                    onClick={() => setShowCustomInput(true)}
                                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/70 text-muted-foreground hover:border-primary hover:text-primary transition-all"
                                >
                                    <Plus className="h-5 w-5"/>
                                    <span>{t('addCustomItem')}</span>
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={customItem}
                                        onChange={(e) => setCustomItem(e.target.value)}
                                        placeholder={t('customItemPlaceholder')}
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCustomServiceItem();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <Button
                                        onClick={addCustomServiceItem}
                                        className="bg-primary hover:bg-primary/90"
                                        disabled={!customItem.trim()}
                                    >
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowCustomInput(false);
                                            setCustomItem('');
                                        }}
                                        variant="outline"
                                    >
                                        {t('cancel')}
                                    </Button>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setServiceFormData({...serviceFormData, serviceItems: []});
                                        setStep(4);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {t('skipItems')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setServiceFormData({...serviceFormData, serviceItems: selectedItems});
                                        setStep(4);
                                    }}
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                >
                                    {t('nextStep')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Service Details */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="date">{t('serviceDate')}</Label>
                                <DatePickerInput
                                    value={serviceFormData.date || ''}
                                    onChange={(date) => setServiceFormData({...serviceFormData, date})}
                                    language={language}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <Label htmlFor="mileage">{t('carMileage')}</Label>
                                <NumericInput
                                    id="mileage"
                                    value={serviceFormData.mileage}
                                    onChange={(value) => setServiceFormData({...serviceFormData, mileage: value})}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <Label htmlFor="cost">{t('serviceCost')}</Label>
                                <NumericInput
                                    id="cost"
                                    value={serviceFormData.cost}
                                    onChange={(value) => setServiceFormData({...serviceFormData, cost: value})}
                                    className="mt-2"
                                    allowDecimal={true}
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">{t('notes')}</Label>
                                <Textarea
                                    id="notes"
                                    value={serviceFormData.notes}
                                    onChange={(e) => setServiceFormData({...serviceFormData, notes: e.target.value})}
                                    className="mt-2"
                                    rows={3}
                                    placeholder={t('notes')}
                                />
                            </div>

                            <Button
                                onClick={() => setStep(5)}
                                className="w-full bg-primary hover:bg-primary/90"
                            >
                                {t('nextStep')}
                            </Button>
                        </div>
                    )}

                    {/* Step 5: Reminder */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h3 className="font-medium">{t('nextServiceReminder')}</h3>

                            <div>
                                <Label>{t('reminderType')}</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <button
                                        onClick={() => setServiceFormData({
                                            ...serviceFormData,
                                            nextServiceType: 'date',
                                            nextServiceValue: ''
                                        })}
                                        className={`py-3 px-4 rounded-xl border transition-all ${
                                            serviceFormData.nextServiceType === 'date'
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        {t('byDate')}
                                    </button>
                                    <button
                                        onClick={() => setServiceFormData({
                                            ...serviceFormData,
                                            nextServiceType: 'mileage',
                                            nextServiceValue: 0
                                        })}
                                        className={`py-3 px-4 rounded-xl border transition-all ${
                                            serviceFormData.nextServiceType === 'mileage'
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-secondary border-border/70 text-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        {t('byMileage')}
                                    </button>
                                </div>
                            </div>

                            {serviceFormData.nextServiceType === 'date' && (
                                <div>
                                    <Label htmlFor="nextDate">{t('serviceDate')}</Label>
                                    <DatePickerInput
                                        value={serviceFormData.nextServiceValue as string}
                                        onChange={(date) => setServiceFormData({...serviceFormData, nextServiceValue: date})}
                                        language={language}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {serviceFormData.nextServiceType === 'mileage' && (
                                <div>
                                    <Label htmlFor="nextMileage">{t('carMileage')}</Label>
                                    <NumericInput
                                        id="nextMileage"
                                        value={serviceFormData.nextServiceValue as number}
                                        onChange={(value) => setServiceFormData({...serviceFormData, nextServiceValue: value})}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {/* Reminder Note - only show if a reminder type is selected */}
                            {serviceFormData.nextServiceType && (
                                <div>
                                    <Label htmlFor="reminderNote">{t('reminderNote')}</Label>
                                    <Textarea
                                        id="reminderNote"
                                        value={serviceFormData.reminderNote}
                                        onChange={(e) => setServiceFormData({...serviceFormData, reminderNote: e.target.value})}
                                        className="mt-2"
                                        rows={2}
                                        placeholder={language === 'fa' ? 'مثلاً: تعویض روغن و فیلتر' : 'e.g., Oil change and filter'}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setServiceFormData({
                                            ...serviceFormData,
                                            nextServiceType: undefined,
                                            nextServiceValue: undefined,
                                            reminderNote: ''
                                        });
                                        handleSubmit();
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {t('skipReminder')}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                    disabled={serviceFormData.nextServiceType && !serviceFormData.nextServiceValue}
                                >
                                    {t('save')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Animation */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        key="success"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.2}}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{scale: 0, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.8, opacity: 0}}
                            transition={{
                                duration: 0.5,
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className="relative">
                                <motion.div
                                    initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{delay: 0.1, duration: 0.4, type: "spring", stiffness: 150}}
                                    className="h-24 w-24 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg"
                                >
                                    <CircleCheck className="h-14 w-14 text-primary-foreground" strokeWidth={2.5}/>
                                </motion.div>
                                {/* Pulse ring effect */}
                                <motion.div
                                    initial={{scale: 1, opacity: 0.6}}
                                    animate={{scale: 1.4, opacity: 0}}
                                    transition={{duration: 0.8, ease: "easeOut"}}
                                    className="absolute inset-0 rounded-full bg-success"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};