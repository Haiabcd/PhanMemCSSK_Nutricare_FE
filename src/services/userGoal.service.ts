// src/services/userGoal.ts
import type { InfoResponse } from '../types/types';
import { getMyInfo } from './user.service';
import type { GoalKey } from '../notifications/hydrationScheduler';

export async function getUserGoal(signal?: AbortSignal): Promise<GoalKey> {
    const res = await getMyInfo(signal);
    const info = res.data as InfoResponse;
    const g = info?.profileCreationResponse?.goal;

    if (g === 'LOSE' || g === 'GAIN' || g === 'MAINTAIN') return g as GoalKey;
    if (g === 'WEIGHT_LOSS') return 'LOSE';
    if (g === 'WEIGHT_GAIN') return 'GAIN';
    return 'MAINTAIN';
}
