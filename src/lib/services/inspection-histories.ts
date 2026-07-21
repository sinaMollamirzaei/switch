import { supabase } from '../supabase';

export interface InspectionHistory {
  id: string;
  carId: string;
  fromDate: string | null;
  toDate: string | null;
}

type InspectionRow = {
  id: string;
  car_id: string;
  from_date: string | null;
  to_date: string | null;
};

function rowToInspection(row: InspectionRow): InspectionHistory {
  return {
    id: row.id,
    carId: row.car_id,
    fromDate: row.from_date,
    toDate: row.to_date
  };
}

export const inspectionHistoriesService = {
  async listByCar(carId: string): Promise<InspectionHistory[]> {
    const { data, error } = await supabase
      .from('inspection_histories')
      .select('id, car_id, from_date, to_date, created_at')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[inspectionHistories.listByCar] error:', error.message, '| code:', error.code);
      throw error;
    }
    return (data ?? []).map((r) => rowToInspection(r as InspectionRow));
  },

  async create(record: Omit<InspectionHistory, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await supabase.from('inspection_histories').insert({
      car_id: record.carId,
      from_date: record.fromDate,
      to_date: record.toDate,
    });
    if (error) {
      console.error('[inspectionHistories.create] error:', error.message, '| code:', error.code);
      throw error;
    }
  },

  async update(id: string, record: Partial<Omit<InspectionHistory, 'id' | 'carId' | 'createdAt'>>): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (record.fromDate !== undefined) payload.from_date = record.fromDate;
    if (record.toDate !== undefined) payload.to_date = record.toDate;

    if (Object.keys(payload).length === 0) return;
    const { error } = await supabase.from('inspection_histories').update(payload).eq('id', id);
    if (error) {
      console.error('[inspectionHistories.update] error:', error.message, '| code:', error.code);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('inspection_histories').delete().eq('id', id);
    if (error) {
      console.error('[inspectionHistories.remove] error:', error.message, '| code:', error.code);
      throw error;
    }
  },
};
