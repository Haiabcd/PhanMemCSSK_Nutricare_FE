import { MealSlot } from './types';

export interface TopFoodDto {
    name: string;
    count: number;
}

export interface DailyNutritionDto {
    date: string;        // ISO date (YYYY-MM-DD)
    proteinG: number;
    carbG: number;
    fatG: number;
    fiberG: number;
}

export interface MealSlotSummaryItem {
    loggedDays: number;
    missedDays: number;
    totalDays: number;
}

export type MealSlotSummary = Record<MealSlot, MealSlotSummaryItem>;

export interface DailyWaterTotalDto {
    date: string;        // ISO date (YYYY-MM-DD)
    totalMl: number;     // int
}
export interface DailyWeightDto{
    date: string;        // ISO date (YYYY-MM-DD)
    weightKg: number;    // float
}
export interface StatisticWeekResponse {
    weightKg: number;
    bmiClassification: string;
    bmi: number;
    topFoods: TopFoodDto[];
    dailyNutrition: DailyNutritionDto[];
    mealSlotSummary: MealSlotSummary;
    dailyWaterTotals: DailyWaterTotalDto[];
    weeklyWeightTrend:DailyWeightDto[];
    warnings: string[];
}

/* ===================== M O N T H L Y   T Y P E S ===================== */

export interface MonthlyWeeklyNutritionDto {
    weekIndex: number;     // 1..5
    weekStart: string;     // ISO date (YYYY-MM-DD)
    weekEnd: string;       // ISO date (YYYY-MM-DD)
    proteinG: number;
    carbG: number;
    fatG: number;
    fiberG: number;
    daysWithLogs: number;  // số ngày có log trong tuần
}

export interface MonthlyWeeklyWaterTotalDto {
    weekIndex: number;     // 1..5
    weekStart: string;     // ISO date (YYYY-MM-DD)
    weekEnd: string;       // ISO date (YYYY-MM-DD)
    totalMl: number;       // tổng ml trong tuần
    daysWithLogs: number;  // số ngày có log nước trong tuần
}

export interface StatisticMonthResponse {
    weightKg: number;
    bmiClassification: string;
    bmi: number;
    topFoods: TopFoodDto[];
    weeklyNutrition: MonthlyWeeklyNutritionDto[];      // tổng theo tuần trong tháng
    mealSlotSummary: MealSlotSummary;
    weeklyWaterTotals: MonthlyWeeklyWaterTotalDto[];    // nước theo tuần
    weeklyWeightTrend:DailyWeightDto[];
    warnings: string[];                                 // cảnh báo gọn theo tuần
}
