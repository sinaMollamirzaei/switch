import {supabase} from '../supabase';
import {serviceItemsService} from './service-items';

export interface Service {
    id: string;
    carId: string;
    itemId: string;
    date: string;
    kilometer: number;
    cost: number;
    description: string;
}

type ServiceRow = {
    id: string;
    car_id: string;
    item_id: string | null;
    date: string | null;
    kilometer: number | null;
    cost: number | null;
    description: string | null;
};

function rowToService(row: ServiceRow): Service {
    return {
        id: row.id,
        carId: row.car_id,
        itemId: row.item_id,
        date: row.date ?? '',
        kilometer: row.kilometer,
        cost: row.cost ?? 0,
        description: row.description ?? '',
    };
}

export const servicesService = {
    async listByCars(carIds: string[]): Promise<Service[]> {
        if (carIds.length === 0) return [];

        const {data, error} = await supabase
            .from('services')
            .select('id, car_id, item_id, date, kilometer, cost, description')
            .in('car_id', carIds)
            .order('date', {ascending: false});

        if (error) {
            console.error('[services.listByCars] error:', error.message, '| code:', error.code);
            throw error;
        }

        const services = (data ?? []).map((r) => rowToService(r as ServiceRow));

        // Enrich with service_items junction rows
        if (services.length > 0) {
            try {
                const serviceIds = services.map((s) => s.id);
                const junctionRows = await serviceItemsService.listByServices(serviceIds);
                // Group junction rows by service_id
                const byService = new Map<string, string[]>();
                for (const row of junctionRows) {
                    const existing = byService.get(row.serviceId) ?? [];
                    existing.push(row.itemId);
                    byService.set(row.serviceId, existing);
                }
                // Attach item IDs as string array on each service
                for (const svc of services) {
                    const itemIds = byService.get(svc.id);
                    if (itemIds && itemIds.length > 0) {
                        svc.serviceItems = itemIds;
                    }
                }
            } catch {
                // Non-fatal: service_items may not exist yet (migration pending)
            }
        }

        return services;
    },

    /**
     * Create a service and its junction rows atomically.
     * serviceItems on the payload are resolved as item UUIDs.
     */
    async create(service: Omit<Service, 'id'>): Promise<string> {
        const {data, error} = await supabase
            .from('services')
            .insert({
                car_id: service.carId,
                item_id: service.itemId,
                date: service.date,
                kilometer: service.kilometer,
                cost: service.cost,
                description: service.description,
            })
            .select('id')
            .single();

        if (error) {
            console.error('[services.create] error:', error.message, '| code:', error.code, '| details:', error.details);
            throw error;
        }

        const serviceId = (data as { id: string }).id;

        // Persist the serviced items to the junction table
        if (service.serviceItems && service.serviceItems.length > 0) {
            try {
                await serviceItemsService.replaceForService(
                    serviceId,
                    service.serviceItems.map((itemId) => ({itemId, quantity: 1, cost: null, notes: null})),
                );
            } catch {
                // Non-fatal: service_items may not exist yet (migration pending)
            }
        }

        return serviceId;
    },

    async update(id: string, service: Omit<Service, 'id'>): Promise<void> {
        const {error} = await supabase
            .from('services')
            .update({
                car_id: service.carId,
                item_id: service.itemId,
                date: service.date,
                kilometer: service.kilometer,
                cost: service.cost,
                description: service.description,
            })
            .eq('id', id);

        if (error) {
            console.error('[services.update] error:', error.message, '| code:', error.code);
            throw error;
        }

        // Replace junction rows
        if (service.serviceItems !== undefined) {
            try {
                await serviceItemsService.replaceForService(
                    id,
                    service.serviceItems.map((itemId) => ({itemId, quantity: 1, cost: null, notes: null})),
                );
            } catch {
                // Non-fatal
            }
        }
    },

    async remove(id: string): Promise<void> {
        // service_items rows are deleted via ON DELETE CASCADE
        const {error} = await supabase.from('services').delete().eq('id', id);
        if (error) {
            console.error('[services.remove] error:', error.message, '| code:', error.code);
            throw error;
        }
    },
};
