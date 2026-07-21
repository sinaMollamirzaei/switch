/**
 * Workflow: Add / Renew Technical Inspection
 *
 * Scenario: User records a new technical inspection (معاینه فنی) for a car.
 * The previous record (if active) is marked expired so only one record
 * per car is ever 'active'.
 *
 * Steps:
 *  1. Expire any currently active inspection record for the car
 *  2. Insert the new record with status 'active'
 *  3. Return the new record id
 */

import { supabase } from '../supabase';
import { inspectionHistoriesService } from '../services/inspection-histories';
import type { InspectionHistory } from '../services/inspection-histories';

export interface AddInspectionInput {
  carId: string;
  startDate: string;
  endDate: string;
  center?: string | null;
  cost?: number | null;
  notes?: string | null;
}

export interface AddInspectionResult {
  inspectionId: string;
  previouslyExpired: boolean;
}

export async function addInspectionWorkflow(input: AddInspectionInput): Promise<AddInspectionResult> {
  let previouslyExpired = false;

  // Step 1: Expire currently active inspection records for this car
  const { data: active } = await supabase
    .from('inspection_histories')
    .select('id')
    .eq('car_id', input.carId)
    .eq('status', 'active')
    .limit(10);

  if (active && active.length > 0) {
    for (const row of active) {
      try {
        await inspectionHistoriesService.update(row.id, { status: 'expired' });
        previouslyExpired = true;
      } catch (err) {
        console.error('[addInspectionWorkflow] Failed to expire old inspection:', err);
      }
    }
  }

  // Step 2: Insert the new inspection record
  await inspectionHistoriesService.create({
    carId: input.carId,
    fromDate: input.startDate,
    toDate: input.endDate,
    status: 'active',
    center: input.center ?? null,
    cost: input.cost ?? null,
    notes: input.notes ?? null,
  });

  // Step 3: Return the new record
  const records = await inspectionHistoriesService.listByCar(input.carId);
  const newest = records[0]; // listByCar orders by created_at DESC
  if (!newest) throw new Error('[addInspectionWorkflow] Could not locate newly created inspection record');

  return { inspectionId: newest.id, previouslyExpired };
}

/**
 * Helper: compute the human-readable validity status for display.
 * Returns 'active', 'expiring-soon' (within 30 days), or 'expired'.
 */
export function inspectionDisplayStatus(record: InspectionHistory): 'active' | 'expiring-soon' | 'expired' {
  if (!record.toDate || record.status === 'expired') return 'expired';
  const end = new Date(record.toDate);
  const today = new Date();
  const daysLeft = Math.floor((end.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring-soon';
  return 'active';
}
