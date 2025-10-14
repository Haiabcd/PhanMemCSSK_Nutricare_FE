export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
//=====================AUTH====================================//
export interface OnboardingResponse {
  tokenResponse: TokenPairResponse;
}

export interface TokenPairResponse {
  tokenType: 'Bearer' | string;
  accessToken: string;
  accessExpiresAt: number;   // epoch seconds
  refreshToken: string;
  refreshExpiresAt: number;  // epoch seconds
}

export interface RefreshRequest {
  refreshToken: string;
}
//=====================AUTH====================================//

//=====================PROFILE=================================//
export interface ProfileDto {
  id: string;
  heightCm: number;
  weightKg: number;
  gender: Gender;
  birthYear: number;
  goal: GoalType;
  activityLevel: ActivityLevel;
  name: string;
  targetWeightDeltaKg: number;
  targetDurationWeeks: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface InfoResponse {
  profileCreationResponse: ProfileDto;
  conditions: UserConditionResponse[];
  allergies: UserAllergyResponse[];
}
export interface UserAllergyResponse {
  id: string;
  name: string;
}
export type UserConditionResponse = UserAllergyResponse;
//=====================PROFILE=================================//


//=====================CONDITION & ALLERGY=====================//
export interface Condition {
  id: string;
  name: string;
  createdAt: string;
}

export type Allergy = Condition;
//=====================CONDITION & ALLERGY=====================//






export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type GoalType = 'LOSE' | 'MAINTAIN' | 'GAIN';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export interface ProfileCreationRequest {
  heightCm: number;            // 80..250
  weightKg: number;            // 30..200
  targetWeightDeltaKg: number; // >= 0 (có @NotNull + default = 0 trên BE)
  targetDurationWeeks: number; // >= 0
  gender: Gender;
  birthYear: number;
  goal: GoalType;
  activityLevel: ActivityLevel;
  name: string;
}

export interface OnboardingRequest {
  deviceId: string;
  profile: ProfileCreationRequest;
  conditions?: string[];
  allergies?: string[];
}

export interface UserDto {
  id: string;
  role: 'GUEST' | 'USER' | 'ADMIN' | string;
  provider: 'NONE' | string;
  deviceId: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export interface NutritionDto {
  kcal: number;
  proteinG: number;
  carbG: number;

  fatG: number;
  fiberG: number;
  sodiumMg: number;
  sugarMg: number;
}

export interface MealPlanDto {
  id: string;
  date: string;
  targetNutrition: NutritionDto;
  waterTargetMl: number;
}


export interface NutritionResponse {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  sugarMg: number;
}

export interface WaterLogCreationRequest {
  drankAt: string;  // ISO-8601 UTC, ví dụ "2025-10-14T08:30:00Z"
  amountMl: number; // >= 0
}