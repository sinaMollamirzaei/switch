import {supabase} from '../supabase';

export interface Car {
    id: string;
    name: string;
    plate: string;
    userId: string;
}

type CarRow = {
    id: string;
    name: string;
    plate: string,
    user_id: string
};

function rowToCar(row: CarRow): Car {
    return {
        id: row.id,
        name: row.name,
        plate: row.plate,
        userId: row.user_id
    };
}

export const carsService = {
    async list(): Promise<Car[]> {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return [];

        const {data, error} = await supabase
            .from('cars')
            .select('id, name, plate')
            .eq('user_id', user.id)
            .order('created_at', {ascending: true});

        if (error) {
            console.error('[cars.list] error:', error.message, '| code:', error.code);
            throw error;
        }
        return (data ?? []).map(rowToCar);
    },

    async create(car: Partial<Car>): Promise<void> {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated: cannot create car');

        const {error} = await supabase.from('cars').insert({
            user_id: user.id,
            name: car.name,
            plate: car.plate,
        });
        if (error) {
            console.error('[cars.create] error:', error.message, '| code:', error.code, '| details:', error.details);
            throw error;
        }
    },

    async update(id: string, changes: Partial<Car>): Promise<boolean> {
        const payload: Record<string, unknown> = {};
        if (changes.name !== undefined) payload.name = changes.name;
        if (changes.plate !== undefined) payload.plate = changes.plate;

        if (Object.keys(payload).length === 0) return false;

        const {error} = await supabase.from('cars').update(payload).eq('id', id);
        if (error) {
            console.error('[cars.update] error:', error.message, '| code:', error.code);
            throw error;
        }
        return true;
    },

    async remove(id: string): Promise<void> {
        const {error} = await supabase.from('cars').delete().eq('id', id);
        if (error) {
            console.error('[cars.remove] error:', error.message, '| code:', error.code);
            throw error;
        }
    },
};
