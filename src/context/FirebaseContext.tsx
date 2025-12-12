import { createContext, useContext } from 'react';

export const FirebaseContext = createContext<{
  fcmToken: string | null;
}>({ fcmToken: null });

export const useFirebase = () => useContext(FirebaseContext);
