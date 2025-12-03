import React, { createContext, useContext, useState } from 'react';

type AuthContextValue = {
    isAuthed: boolean;
    setIsAuthed: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthed, setIsAuthed] = useState(false);

    return (
        <AuthContext.Provider value={{ isAuthed, setIsAuthed }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return ctx;
};
