export const safeNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  
  export const fmtNum = (n: number, digits = 1) =>
    (Math.round(n * 10 ** digits) / 10 ** digits).toString();
  
  export const isBlank = (s?: string) => !s || s.trim().length === 0;
  