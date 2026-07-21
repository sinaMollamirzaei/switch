import { supabase } from '../supabase';

// public.service_items columns: id, service_id, item_id, quantity, cost, notes, created_at
export interface ServiceItem {
  id: string;
  serviceId: string;
  itemId: string;
}

type ServiceItemRow = {
  id: string;
  service_id: string;
  item_id: string;
};

function rowToServiceItem(row: ServiceItemRow): ServiceItem {
  return {
    id: row.id,
    serviceId: row.service_id,
    itemId: row.item_id,
  };
}

export const serviceItemsService = {
  /** Load all service_items rows for a given service. */
  async listByService(serviceId: string): Promise<ServiceItem[]> {
    const { data, error } = await supabase
      .from('service_items')
      .select('id, service_id, item_id')
      .eq('service_id', serviceId);

    if (error) {
      console.error('[serviceItems.listByService] error:', error.message, '| code:', error.code);
      throw error;
    }
    return (data ?? []).map((r) => rowToServiceItem(r as ServiceItemRow));
  },

  /** Bulk-load service_items for multiple services (used when loading a car's full history). */
  async listByServices(serviceIds: string[]): Promise<ServiceItem[]> {
    if (serviceIds.length === 0) return [];
    const { data, error } = await supabase
      .from('service_items')
      .select('id, service_id, item_id')
      .in('service_id', serviceIds);

    if (error) {
      console.error('[serviceItems.listByServices] error:', error.message, '| code:', error.code);
      throw error;
    }
    return (data ?? []).map((r) => rowToServiceItem(r as ServiceItemRow));
  },

  /** Insert a single service_item row. */
  async create(item: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
    const { data, error } = await supabase
      .from('service_items')
      .insert({
        service_id: item.serviceId,
        item_id: item.itemId
      })
      .select('id, service_id, item_id')
      .single();

    if (error) {
      console.error('[serviceItems.create] error:', error.message, '| code:', error.code);
      throw error;
    }
    return rowToServiceItem(data as ServiceItemRow);
  },

  /** Bulk-insert all items for a service (replaces existing rows). */
  async replaceForService(serviceId: string, items: Omit<ServiceItem, 'id' | 'serviceId'>[]): Promise<void> {
    // Delete existing rows first (ON DELETE CASCADE on services handles service deletion,
    // but for updates we need to explicitly replace).
    const { error: delErr } = await supabase
      .from('service_items')
      .delete()
      .eq('service_id', serviceId);

    if (delErr) {
      console.error('[serviceItems.replaceForService] delete error:', delErr.message);
      throw delErr;
    }

    if (items.length === 0) return;

    const rows = items.map((item) => ({
      service_id: serviceId,
      item_id: item.itemId
    }));

    const { error: insErr } = await supabase.from('service_items').insert(rows);
    if (insErr) {
      console.error('[serviceItems.replaceForService] insert error:', insErr.message);
      throw insErr;
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('service_items').delete().eq('id', id);
    if (error) {
      console.error('[serviceItems.remove] error:', error.message, '| code:', error.code);
      throw error;
    }
  },
};
