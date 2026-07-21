import {supabase} from '../supabase';

export interface Reminder {
    id: string;
    carId: string;
    itemId: string;
    targetDate?: string;
    targetKilometer?: number;
    description?: string;
}

type ReminderRow = {
    id: string;
    car_id: string;
    item_id: string;
    target_date: string | null;
    target_kilometer: number | null;
    description: string | null;
};


function rowToReminder(row: ReminderRow): Reminder {
    return {
        id: row.id,
        carId: row.car_id,
        itemId: row.item_id,
        targetDate: row.target_date,
        targetKilometer: row.target_kilometer,
        description: row.description
    };
}

export const remindersService = {
    async listByCars(carIds: string[]): Promise<Reminder[]> {
        if (carIds.length === 0) return [];
        const {data, error} = await supabase
            .from('reminders')
            .select('id, car_id, item_id, target_date, target_kilometer, description')
            .in('car_id', carIds)
            .order('created_at', {ascending: false});

        if (error) {
            console.error('[reminders.listByCars] error:', error.message, '| code:', error.code);
            throw error;
        }
        return (data ?? []).map((r) => rowToReminder(r as ReminderRow));
    },

    async create(reminder: Omit<Reminder, 'id'>): Promise<void> {
        const {error} = await supabase.from('reminders').insert({
            car_id: reminder.carId,
            item_id: reminder.itemId,
            taget_date: reminder.targetDate,
            taget_kilometer: reminder.targetKilometer,
            description: reminder.description
        });
        if (error) {
            console.error('[reminders.create] error:', error.message, '| code:', error.code, '| details:', error.details);
            throw error;
        }
    },

    async remove(id: string): Promise<void> {
        const {error} = await supabase.from('reminders').delete().eq('id', id);
        if (error) {
            console.error('[reminders.remove] error:', error.message, '| code:', error.code);
            throw error;
        }
    },
};
