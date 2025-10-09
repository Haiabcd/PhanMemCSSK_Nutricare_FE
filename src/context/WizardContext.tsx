// WizardContext.tsx
import React, { useCallback, useMemo, useState } from 'react';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export type Gender = 'male' | 'female' | 'other';
export type Target = 'lose' | 'maintain' | 'gain';

export interface Form {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  target: Target;
  activityLevel: ActivityLevel;

  /** Mục tiêu kế hoạch */
  targetWeightDeltaKg: number; // âm khi giảm, dương khi tăng
  targetDurationWeeks: number; // số tuần

  /** Bệnh nền & dị ứng: MẢNG ID */
  chronicConditions: string[];
  allergies: string[];
  hasNoChronicConditions: boolean;
  hasNoAllergies: boolean;
  targetPlanValid: boolean;
}

interface WizardContextType {
  form: Form;
  updateForm: (patch: Partial<Form>) => void;

  setHeightCm: (cm: number) => void;
  setWeightKg: (kg: number) => void;
  resetBodyMetrics: () => void;

  addCondition: (id: string) => void;
  removeCondition: (id: string) => void;
  clearConditions: () => void;
  setNoChronicConditions: (no: boolean) => void;

  addAllergy: (id: string) => void;
  removeAllergy: (id: string) => void;
  clearAllergies: () => void;
  setNoAllergies: (no: boolean) => void;
}

const WizardContext = React.createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [form, setForm] = useState<Form>({
    name: '',
    age: 2003,
    gender: 'male',
    heightCm: 170,
    weightKg: 65,
    target: 'lose',
    activityLevel: 'SEDENTARY',

    targetWeightDeltaKg: 0,
    targetDurationWeeks: 0,

    chronicConditions: [],
    allergies: [],
    hasNoChronicConditions: false,
    hasNoAllergies: false,
    targetPlanValid: false,
  });

  const updateForm = useCallback((patch: Partial<Form>) => {
    const normalized: Partial<Form> = { ...patch };
    if (
      'heightCm' in patch &&
      (patch.heightCm == null || Number.isNaN(patch.heightCm))
    ) {
      normalized.heightCm = 170;
    }
    if (
      'weightKg' in patch &&
      (patch.weightKg == null || Number.isNaN(patch.weightKg))
    ) {
      normalized.weightKg = 65;
    }
    if (
      'targetDurationWeeks' in patch &&
      (patch.targetDurationWeeks as any) < 0
    ) {
      normalized.targetDurationWeeks = 0;
    }
    setForm(prev => ({ ...prev, ...normalized }));
  }, []);

  const setHeightCm = useCallback((cm: number) => {
    const safe = Math.max(80, Math.min(250, Math.round(cm)));
    setForm(prev => ({ ...prev, heightCm: safe }));
  }, []);

  const setWeightKg = useCallback((kg: number) => {
    const safe = Math.max(20, Math.min(400, Math.round(kg)));
    setForm(prev => ({ ...prev, weightKg: safe }));
  }, []);

  const resetBodyMetrics = useCallback(() => {
    setForm(prev => ({ ...prev, heightCm: 170, weightKg: 65 }));
  }, []);

  // ===== Bệnh nền (ID) =====
  const addCondition = useCallback((id: string) => {
    const val = id.trim();
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

  const removeCondition = useCallback((id: string) => {
    setForm(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter(x => x !== id),
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

  // ===== Dị ứng (ID) =====
  const addAllergy = useCallback((id: string) => {
    const val = id.trim();
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

  const removeAllergy = useCallback((id: string) => {
    setForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter(x => x !== id),
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
    ],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard(): WizardContextType {
  const ctx = React.useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within a WizardProvider');
  return ctx;
}
