import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getHeader } from '../services/user.service';
import type { HeaderResponse } from '../types/user.type';

type HeaderCtx = {
  header: HeaderResponse | null;
  loading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  reset: () => void;
};

const Ctx = createContext<HeaderCtx>({
  header: null,
  loading: true,
  error: null,
  refresh: async () => {},
  reset: () => {},
});

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<HeaderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHeader();
      setHeader(res?.data ?? null);
    } catch (e) {
      setError('Không thể tải header');
      setHeader(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHeader(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ header, loading, error, refresh, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export const useHeader = () => useContext(Ctx);
