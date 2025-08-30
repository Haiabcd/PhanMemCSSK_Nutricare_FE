import React, { useCallback, useContext, useState } from "react";

export type Gender = "male" | "female" | "other";
export type ActivityLevel = "Sedentary" | "LightlyActive" | "ModeratelyActive" | "VeryActive" | "SuperActive";

export type Form = {
    name: string;
    age: number | null;
    gender: Gender;
    height: number | null;
    weight: number | null;
    target?: "gainWeight" | "loseWeight" | "maintainWeight" | null;
    activityLevel?: ActivityLevel | null;
};

type Ctx = {
    form: Form;
    updateForm: (patch: Partial<Form>) => void;
};

const WizardContext = React.createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
    const [form, setForm] = useState<Form>({
        name: "",
        age: null,
        gender: "male",
        height: null,
        weight: null,
        target: null,
        activityLevel: "LightlyActive",
    });

    const updateForm = useCallback((patch: Partial<Form>) => {
        setForm(f => ({ ...f, ...patch }));
    }, []);

    return <WizardContext.Provider value={{ form, updateForm }}>{children}</WizardContext.Provider>;
}

export function useWizard() {
    const ctx = useContext(WizardContext);
    if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
    return ctx;
}
