import { supabase } from '../supabase';

export interface InsuranceHistory {
  id: string;
  carId: string;
  fromDate: string | null;
  toDate: string | null;
  createdAt: string;
  updatedAt: string;
}

type InsuranceRow = {
  id: string;
  car_id: string;
  from_date: string | null;
  to_date: string | null;
  created_at: string;
  updated_at: string;
};

function rowToInsurance(row: InsuranceRow): InsuranceHistory {
  return {
    id: row.id,
    carId: row.car_id,
    fromDate: row.from_date,
    toDate: row.to_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const insuranceHistoriesService = {
  async listByCar(carId: string): Promise<InsuranceHistory[]> {
    const { data, error } = await supabase
      .from('insurance_histories')
      .select('id, car_id, from_date, to_date, created_at, updated_at')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[insuranceHistories.listByCar] error:', error.message, '| code:', error.code);
      throw error;
    }
    return (data ?? []).map((r) => rowToInsurance(r as InsuranceRow));
  },

  async create(record: Omit<InsuranceHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const { error } = await supabase.from('insurance_histories').insert({
      car_id: record.carId,
      from_date: record.fromDate,
      to_date: record.toDate
    });
    if (error) {
      console.error('[insuranceHistories.create] error:', error.message, '| code:', error.code);
      throw error;
    }
  },

  async update(id: string, record: Partial<Omit<InsuranceHistory, 'id' | 'carId' | 'createdAt'>>): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (record.fromDate !== undefined) payload.from_date = record.fromDate;
    if (record.toDate !== undefined) payload.to_date = record.toDate;

    if (Object.keys(payload).length === 0) return;
    const { error } = await supabase.from('insurance_histories').update(payload).eq('id', id);
    if (error) {
      console.error('[insuranceHistories.update] error:', error.message, '| code:', error.code);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('insurance_histories').delete().eq('id', id);
    if (error) {
      console.error('[insuranceHistories.remove] error:', error.message, '| code:', error.code);
      throw error;
    }
  },
};
