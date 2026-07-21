import React, {useState} from 'react';
import {useApp, Car} from '../context/AppContext';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {LicensePlateInput} from './ui/license-plate-input';
import {DatePickerInput} from './ui/date-picker';
import {ValiditySection} from './ValiditySection';
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from './ui/sheet';
import {toast} from 'sonner';
import {Pencil, Trash2, Plus} from 'lucide-react';

export const CarManagement: React.FC = () => {
    console.log('CarManagement rendered');
    const {t, cars, carsLoading, addCar, updateCar, deleteCar, services, language} = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editingDatesFor, setEditingDatesFor] = useState<{
        carId: string;
        type: 'insurance' | 'technicalInspection'
    } | null>(null);
    const [dateFormData, setDateFormData] = useState<{ startDate: string; endDate: string }>({
        startDate: '',
        endDate: ''
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

    const handleOpenDateEditor = (carId: string, type: 'insurance' | 'technicalInspection') => {
        const car = cars.find(c => c.id === carId);
        if (!car) return;

        if (type === 'insurance') {
            setDateFormData({
                startDate: car.insuranceStartDate || '',
                endDate: car.insuranceEndDate || '',
            });
        } else {
            setDateFormData({
                startDate: car.technicalInspectionStartDate || '',
                endDate: car.technicalInspectionEndDate || '',
            });
        }

        setEditingDatesFor({carId, type});
    };

    const handleSaveDates = async () => {
        if (!editingDatesFor) return;

        const {carId, type} = editingDatesFor;

        if (!dateFormData.startDate || !dateFormData.endDate) {
            toast.error(t('pleaseFillAllFields') || 'Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            if (type === 'insurance') {
                await updateCar(carId, {
                    insuranceStartDate: dateFormData.startDate,
                    insuranceEndDate: dateFormData.endDate,
                });
            } else {
                await updateCar(carId, {
                    technicalInspectionStartDate: dateFormData.startDate,
                    technicalInspectionEndDate: dateFormData.endDate,
                });
            }
            toast.success(t('savedSuccessfully') || 'Saved successfully!');
            setEditingDatesFor(null);
            setDateFormData({startDate: '', endDate: ''});
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
                                    value={formData.licensePlate}
                                    onChange={(value) => setFormData({...formData, licensePlate: value})}
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
                            {cars.map(car => (
                                <div
                                    key={car.id}
                                    className="rounded-xl bg-card border border-border/70 p-4 space-y-4"
                                >
                                    {/* Vehicle Main Info */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-card-foreground">{car.name}</h4>
                                            <p className="text-sm text-muted-foreground mt-0.5">{car.plate}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(car)}
                                                className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                                                disabled={editingId !== null || isAdding}
                                            >
                                                <Pencil className="h-4 w-4 text-foreground"/>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(car.id)}
                                                className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-destructive/10 transition-colors"
                                                disabled={editingId !== null || isAdding}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Insurance Section */}
                                    <ValiditySection
                                        title={t('insurance')}
                                        startDate={car.insuranceStartDate}
                                        endDate={car.insuranceEndDate}
                                        onAddDates={() => handleOpenDateEditor(car.id, 'insurance')}
                                        onEdit={() => handleOpenDateEditor(car.id, 'insurance')}
                                    />

                                    {/* Technical Inspection Section */}
                                    <ValiditySection
                                        title={t('technicalInspection')}
                                        startDate={car.technicalInspectionStartDate}
                                        endDate={car.technicalInspectionEndDate}
                                        onAddDates={() => handleOpenDateEditor(car.id, 'technicalInspection')}
                                        onEdit={() => handleOpenDateEditor(car.id, 'technicalInspection')}
                                    />
                                </div>
                            ))}
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
                                value={dateFormData.startDate}
                                onChange={(value) => setDateFormData({...dateFormData, startDate: value})}
                                language={language}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex gap-4 ">
                            <Label>{t('to')}</Label>
                            <DatePickerInput
                                value={dateFormData.endDate}
                                onChange={(value) => setDateFormData({...dateFormData, endDate: value})}
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