import React, {useState} from 'react';
import {useApp} from '../context/AppContext';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {LicensePlateInput} from './ui/license-plate-input';
import {DatePickerInput} from './ui/date-picker';
import {ValiditySection} from './ValiditySection';
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from './ui/sheet';
import {toast} from 'sonner';
import {Pencil, Trash2, Plus} from 'lucide-react';
import {Car} from "../../lib/services";

export const CarManagement: React.FC = () => {
    console.log('CarManagement rendered');
    const {
        t,
        cars,
        carsLoading,
        addCar,
        updateCar,
        deleteCar,
        insuranceHistories,
        addInsuranceHistory,
        inspectionHistories,
        addInspectionHistory,
        language
    } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editingDatesFor, setEditingDatesFor] = useState<{
        carId: string;
        type: 'insurance' | 'inspection'
    } | null>(null);
    const [dateFormData, setDateFormData] = useState<{ fromDate: string; toDate: string }>({
        fromDate: '',
        toDate: ''
    });
    const [formData, setFormData] = useState<Omit<Car, 'id'>>({
        userId: "",
        name: '',
        plate: ''
    });

    const handleAdd = async () => {
        if (!formData.name || !formData.plate) {
            toast.error('Please fill in all fields');
            return;
        }

        setSaving(true);
        console.log('[CarManagement] adding car:', formData);
        try {
            await addCar(formData);
            toast.success('Car added successfully!');
            setFormData({userId: "", name: '', plate: ''});
            setIsAdding(false);
        } catch {
            toast.error('Failed to save car. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (car: Car) => {
        setEditingId(car.id);
        setFormData({userId: car.userId, name: car.name, plate: car.plate});
    };

    const handleUpdate = async () => {
        if (!formData.name || !formData.plate || !editingId) {
            toast.error('Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            await updateCar(editingId, formData);
            toast.success('Car updated successfully!');
            setFormData({userId: "", name: '', plate: ''});
            setEditingId(null);
        } catch {
            toast.error('Failed to update car. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this car?')) {
            try {
                await deleteCar(id);
                toast.success('Car deleted successfully!');
            } catch {
                toast.error('Failed to delete car. Please try again.');
            }
        }
    };

    const handleCancel = () => {
        setFormData({userId: "", name: '', plate: ''});
        setIsAdding(false);
        setEditingId(null);
    };

    const handleOpenDateEditor = (carId: string, type: 'insurance' | 'inspection') => {
        const car = cars.find(c => c.id === carId);
        if (!car) return;

        if (type === 'insurance') {
            setDateFormData({
                fromDate: car.insuranceFromDate || '',
                toDate: car.insuranceToDate || '',
            });
        } else {
            setDateFormData({
                fromDate: car.technicalInspectionFromDate || '',
                toDate: car.technicalInspectionToDate || '',
            });
        }

        setEditingDatesFor({carId, type});
    };

    const handleSaveDates = async () => {
        if (!editingDatesFor) return;

        const {carId, type} = editingDatesFor;

        if (!dateFormData.fromDate || !dateFormData.toDate) {
            toast.error(t('pleaseFillAllFields') || 'Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            if (type === 'insurance') {
                await addInsuranceHistory({
                    fromDate: dateFormData.fromDate,
                    toDate: dateFormData.toDate,
                    carId: carId
                });
            } else {
                await addInspectionHistory({
                    fromDate: dateFormData.fromDate,
                    toDate: dateFormData.toDate,
                    carId: carId
                });
            }
            toast.success(t('savedSuccessfully') || 'Saved successfully!');
            setEditingDatesFor(null);
            setDateFormData({fromDate: '', toDate: ''});
        } catch {
            toast.error('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/70">
                <div className="flex items-center justify-between px-4 py-4">
                    <h1 className="text-foreground font-semibold">{t('cars')}</h1>
                    {!isAdding && !editingId && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-5 w-5 text-primary-foreground"/>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="max-w-md mx-auto space-y-4">
                    {/* Add/Edit Form */}
                    {(isAdding || editingId) && (
                        <div className="rounded-xl bg-card border border-border/70 p-4 space-y-4">
                            <h3 className="font-medium">
                                {isAdding ? t('addNewCar') : t('edit')}
                            </h3>

                            <div>
                                <Label htmlFor="carName">{t('carName')}</Label>
                                <Input
                                    id="carName"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Toyota Camry 2020"
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <Label htmlFor="licensePlate">{t('licensePlate')}</Label>
                                <LicensePlateInput
                                    value={formData.plate}
                                    onChange={(value) => setFormData({...formData, plate: value})}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    onClick={isAdding ? handleAdd : handleUpdate}
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                    disabled={saving}
                                >
                                    {saving ? '...' : t('save')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Car List */}
                    {carsLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>{'...'}</p>
                        </div>
                    ) : cars.length > 0 ? (
                        <div className="space-y-4">
                            {cars.map(car => {
                                const insurance = insuranceHistories
                                    .filter(history => history.carId === car.id)
                                    .sort((a, b) => b.toDate.localeCompare(a.toDate))[0];

                                const inspection = inspectionHistories
                                    .filter(history => history.carId === car.id)
                                    .sort((a, b) => b.toDate.localeCompare(a.toDate))[0];

                                return (
                                    <div key={car.id}>
                                        <h4>{car.name}</h4>
                                        <p>{car.plate}</p>

                                        <ValiditySection
                                            title={t('insurance')}
                                            fromDate={insurance?.fromDate}
                                            toDate={insurance?.toDate}
                                            onAddDates={() =>
                                                handleOpenDateEditor(car.id, 'insurance')
                                            }
                                            onEdit={() =>
                                                handleOpenDateEditor(car.id, 'insurance')
                                            }
                                        />

                                        <ValiditySection
                                            title={t('inspection')}
                                            fromDate={inspection?.fromDate}
                                            toDate={inspection?.toDate}
                                            onAddDates={() =>
                                                handleOpenDateEditor(car.id, 'inspection')
                                            }
                                            onEdit={() =>
                                                handleOpenDateEditor(car.id, 'inspection')
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>{t('noCars')}</p>
                        </div>
                    )}

                </div>
            </div>

            {/* Date Edit Sheet */}
            <Sheet open={editingDatesFor !== null} onOpenChange={(open) => !open && setEditingDatesFor(null)}>
                <SheetContent side="bottom" className="h-auto p-4">
                    <SheetHeader>
                        <SheetTitle className="text-center">
                            {editingDatesFor?.type === 'insurance' ? t('insurance') : t('technicalInspection')}
                        </SheetTitle>
                        <SheetDescription className="text-center">
                            {t('addDates')}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        <div className="flex gap-4 w-[330px]">
                            <Label>{t('from')}</Label>
                            <DatePickerInput
                                value={dateFormData.fromDate}
                                onChange={(value) => setDateFormData({...dateFormData, fromDate: value})}
                                language={language}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex gap-4 ">
                            <Label>{t('to')}</Label>
                            <DatePickerInput
                                value={dateFormData.toDate}
                                onChange={(value) => setDateFormData({...dateFormData, toDate: value})}
                                language={language}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex gap-2 py-4">
                            <Button
                                onClick={() => setEditingDatesFor(null)}
                                variant="outline"
                                className="flex-1"
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={handleSaveDates}
                                className="flex-1 bg-primary hover:bg-primary/90"
                                disabled={saving}
                            >
                                {saving ? '...' : t('save')}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};