
import type {Gender,GoalType,ActivityLevel} from './types'
export interface HeaderResponse{
    name: string;
    avatarUrl: string;
}

export interface UpdateRequest {
    profile : ProfileUpdateRequest;
    conditions : string[];
    allergies : string[];
    startDate : string;
}

export interface ProfileUpdateRequest {
    id:string
    heightCm:number
    weightKg:number
    targetWeightDeltaKg:number
    targetDurationWeeks:number
    gender : Gender
    birthYear : number
    goal : GoalType
    activityLevel : ActivityLevel
    name: string
}

export interface WeightUpdateRequest {
    weightKg:number
}
