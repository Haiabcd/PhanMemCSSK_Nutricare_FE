import React, { useCallback, useContext, useMemo, useState } from 'react';

/* ==== Defaults (đổi ở đây là áp toàn app) ==== */
const DEFAULT_HEIGHT_CM = 170;
const DEFAULT_WEIGHT_KG = 65;

/* ==== Types ==== */
export type ActivityLevel =
  | 'Sedentary'
  | 'LightlyActive'
  | 'ModeratelyActive'
  | 'VeryActive'
  | 'ExtremelyActive';

export type Gender = 'male' | 'female' | 'other';
export type Target = 'lose' | 'maintain' | 'gain';

/** Chỉ dùng metric (cm, kg) */
export interface Form {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  target: Target;
  activityLevel: ActivityLevel;
  chronicConditions: string[];
  allergies: string[];
  hasNoChronicConditions: boolean;
  hasNoAllergies: boolean;

  // === NEW: Kế hoạch mục tiêu (tùy chọn cho lose/gain) ===
  /** Số kg muốn thay đổi (luôn dương), ví dụ 5 (kg) */
  targetAmountKg?: number;
  /** Thời lượng để đạt mục tiêu, tính theo tuần, ví dụ 8 (tuần) */
  targetDurationWeeks?: number;
  /** Tốc độ mỗi tuần (kg/tuần), có dấu: âm nếu giảm, dương nếu tăng */
  goalRatePerWeekKg?: number;
  /** Điều chỉnh calo mỗi ngày (kcal/ngày), âm nếu giảm, dương nếu tăng */
  dailyCalorieAdjustment?: number;

  targetPlanValid?: boolean;
}

interface WizardContextType {
  form: Form;
  updateForm: (patch: Partial<Form>) => void;
  setHeightCm: (cm: number) => void;
  setWeightKg: (kg: number) => void;
  resetBodyMetrics: () => void;
  addCondition: (name: string) => void;
  removeCondition: (name: string) => void;
  clearConditions: () => void;
  setNoChronicConditions: (no: boolean) => void;
  addAllergy: (name: string) => void;
  removeAllergy: (name: string) => void;
  clearAllergies: () => void;
  setNoAllergies: (no: boolean) => void;

  // Optional helper để set goal plan trong một lệnh
  setGoalPlan?: (params: { kg: number; weeks: number; target: Target }) => void;
}

/* ==== Context ==== */
const WizardContext = React.createContext<WizardContextType | null>(null);

/* ==== Helpers ==== */
function calcDailyAdjustment(kgChange: number, weeks: number) {
  const days = Math.max(1, Math.round(weeks * 7));
  return (kgChange * 7700) / days; // kcal/day (unsigned)
}

/* ==== Provider ==== */
export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [form, setForm] = useState<Form>({
    name: '',
    age: 2003,
    gender: 'male',
    heightCm: DEFAULT_HEIGHT_CM,
    weightKg: DEFAULT_WEIGHT_KG,
    target: 'lose',
    activityLevel: 'Sedentary',
    chronicConditions: [],
    allergies: [],
    hasNoChronicConditions: false,
    hasNoAllergies: false,
    // goal plan fields sẽ fill khi user chọn lose/gain
  });

  /** Merge patch + đảm bảo height/weight không bao giờ null/undefined */
  const updateForm = useCallback((patch: Partial<Form>) => {
    const normalized: Partial<Form> = { ...patch };
    if (
      'heightCm' in patch &&
      (patch.heightCm == null || Number.isNaN(patch.heightCm))
    ) {
      normalized.heightCm = DEFAULT_HEIGHT_CM;
    }
    if (
      'weightKg' in patch &&
      (patch.weightKg == null || Number.isNaN(patch.weightKg))
    ) {
      normalized.weightKg = DEFAULT_WEIGHT_KG;
    }
    setForm(prev => ({ ...prev, ...normalized }));
  }, []);

  /* ===== Metric helpers ===== */
  const setHeightCm = useCallback((cm: number) => {
    const safe = Math.max(80, Math.min(250, Math.round(cm)));
    setForm(prev => ({ ...prev, heightCm: safe }));
  }, []);

  const setWeightKg = useCallback((kg: number) => {
    const safe = Math.max(20, Math.min(400, Math.round(kg)));
    setForm(prev => ({ ...prev, weightKg: safe }));
  }, []);

  const resetBodyMetrics = useCallback(() => {
    setForm(prev => ({
      ...prev,
      heightCm: DEFAULT_HEIGHT_CM,
      weightKg: DEFAULT_WEIGHT_KG,
    }));
  }, []);

  /* ===== Bệnh nền ===== */
  const addCondition = useCallback((name: string) => {
    const val = name.trim();
    if (!val) return;
    setForm(prev => {
      if (prev.chronicConditions.includes(val)) return prev;
      return {
        ...prev,
        chronicConditions: [...prev.chronicConditions, val],
        hasNoChronicConditions: false,
      };
    });
  }, []);

  const removeCondition = useCallback((name: string) => {
    setForm(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter(c => c !== name),
    }));
  }, []);

  const clearConditions = useCallback(() => {
    setForm(prev => ({ ...prev, chronicConditions: [] }));
  }, []);

  const setNoChronicConditions = useCallback((no: boolean) => {
    setForm(prev => ({
      ...prev,
      hasNoChronicConditions: no,
      chronicConditions: no ? [] : prev.chronicConditions,
    }));
  }, []);

  /* ===== Dị ứng ===== */
  const addAllergy = useCallback((name: string) => {
    const val = name.trim();
    if (!val) return;
    setForm(prev => {
      if (prev.allergies.includes(val)) return prev;
      return {
        ...prev,
        allergies: [...prev.allergies, val],
        hasNoAllergies: false,
      };
    });
  }, []);

  const removeAllergy = useCallback((name: string) => {
    setForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== name),
    }));
  }, []);

  const clearAllergies = useCallback(() => {
    setForm(prev => ({ ...prev, allergies: [] }));
  }, []);

  const setNoAllergies = useCallback((no: boolean) => {
    setForm(prev => ({
      ...prev,
      hasNoAllergies: no,
      allergies: no ? [] : prev.allergies,
    }));
  }, []);

  /* ===== Goal plan helper (optional) ===== */
  const setGoalPlan = useCallback(
    (params: { kg: number; weeks: number; target: Target }) => {
      const kgAbs = Math.max(0, Number(params.kg) || 0);
      const weeks = Math.max(1, Number(params.weeks) || 0);
      const daily = calcDailyAdjustment(kgAbs, weeks); // unsigned
      const sign =
        params.target === 'lose' ? -1 : params.target === 'gain' ? 1 : 0;
      setForm(prev => ({
        ...prev,
        target: params.target,
        targetAmountKg: kgAbs,
        targetDurationWeeks: weeks,
        goalRatePerWeekKg: (kgAbs / weeks) * sign,
        dailyCalorieAdjustment: daily * sign,
      }));
    },
    [],
  );

  const value = useMemo(
    (): WizardContextType => ({
      form,
      updateForm,
      setHeightCm,
      setWeightKg,
      resetBodyMetrics,
      addCondition,
      removeCondition,
      clearConditions,
      setNoChronicConditions,
      addAllergy,
      removeAllergy,
      clearAllergies,
      setNoAllergies,
      setGoalPlan,
    }),
    [
      form,
      updateForm,
      setHeightCm,
      setWeightKg,
      resetBodyMetrics,
      addCondition,
      removeCondition,
      clearConditions,
      setNoChronicConditions,
      addAllergy,
      removeAllergy,
      clearAllergies,
      setNoAllergies,
      setGoalPlan,
    ],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

/* ==== Hook ==== */
export function useWizard(): WizardContextType {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within a WizardProvider');
  return ctx;
}
