// src/context/AuthProvider.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';

type AuthCtx = {
    isAuthed: boolean;
    setAuthed: (v: boolean) => void;
};

const Ctx = createContext<AuthCtx>({ isAuthed: false, setAuthed: () => { } });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthed, setAuthed] = useState(false);
    const value = useMemo(() => ({ isAuthed, setAuthed }), [isAuthed]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
