import type { UserAllergyResponse, UserConditionResponse } from '../types/types';

export const calcAge = (birthYear?: number) => {
    if (!birthYear) return '';
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
};
export const displayGender = (gender?: string) => {
    switch (gender) {
        case 'MALE':
            return 'Nam';
        case 'FEMALE':
            return 'Nữ';
        case 'OTHER':
            return 'Khác';
        default:
            return '';
    }
};

export const translateGoal = (goal?: string): string => {
    switch (goal) {
        case 'GAIN':
            return 'Tăng cân';
        case 'LOSE':
            return 'Giảm cân';
        case 'MAINTAIN':
            return 'Duy trì cân nặng';
        default:
            return 'Không xác định';
    }
};


export const translateActivityLevel = (level?: string): string => {
    switch (level) {
        case 'SEDENTARY':
            return 'Ít vận động';
        case 'LIGHTLY_ACTIVE':
            return 'Vận động nhẹ';
        case 'MODERATELY_ACTIVE':
            return 'Vận động vừa phải';
        case 'VERY_ACTIVE':
            return 'Vận động nhiều';
        case 'EXTRA_ACTIVE':
            return 'Vận động rất nhiều';
        default:
            return 'Không xác định';
    }
};

export const getAllergyNames = (allergies?: UserAllergyResponse[]): string => {
    if (!allergies || allergies.length === 0) return 'Không có dị ứng';
    return allergies.map(a => a.name).join(', ');
};

export const getConditionNames = (conditions?: UserConditionResponse[]): string => {
    if (!conditions || conditions.length === 0) return 'Không có bệnh nền';
    return conditions.map(a => a.name).join(', ');
};


export const GOAL_OPTIONS = [
    { label: 'Giảm cân', value: 'LOSE' },
    { label: 'Duy trì cân nặng', value: 'MAINTAIN' },
    { label: 'Tăng cân', value: 'GAIN' },
];

export const ACTIVITY_OPTIONS = [
    { label: 'Ít vận động', value: 'SEDENTARY' },
    { label: 'Vận động nhẹ', value: 'LIGHTLY_ACTIVE' },
    { label: 'Vận động vừa phải', value: 'MODERATELY_ACTIVE' },
    { label: 'Vận động nhiều', value: 'VERY_ACTIVE' },
    { label: 'Vận động rất nhiều', value: 'EXTRA_ACTIVE' },
];

export const GENDER_OPTIONS = [
    { label: 'Nam', value: 'MALE' },
    { label: 'Nữ', value: 'FEMALE' },
    { label: 'Khác', value: 'OTHER' },
];


export const toYMDLocal = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);