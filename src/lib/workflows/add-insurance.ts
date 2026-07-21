import {supabase} from '../supabase';
import {insuranceHistoriesService} from '../services';
import type {InsuranceHistory} from '../services';

export interface AddInsuranceInput {
    carId: string;
    fromDate: string;
    toDate: string;
}

export async function addInsuranceWorkflow(input: AddInsuranceInput): Promise<string> {
    let previouslyExpired = false;

    //TODO : check that current car has active insurance

    await insuranceHistoriesService.create({
        carId: input.carId,
        fromDate: input.fromDate,
        toDate: input.toDate,
    });

    // Step 3: Return the new record id by fetching the latest for this car
    const records = await insuranceHistoriesService.listByCar(input.carId);
    const newest = records[0]; // listByCar orders by created_at DESC
    if (!newest) throw new Error('[addInsuranceWorkflow] Could not locate newly created insurance record');

    return newest.id;
}

/**
 * Helper: compute the human-readable validity status for display.
 * Returns 'active', 'expiring-soon' (within 30 days), or 'expired'.
 */
export function insuranceDisplayStatus(record: InsuranceHistory): 'active' | 'expiring-soon' | 'expired' {
    const end = new Date(record.toDate);
    const today = new Date();
    const daysLeft = Math.floor((end.getTime() - today.getTime()) / 86_400_000);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring-soon';
    return 'active';
}
