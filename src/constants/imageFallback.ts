// src/constants/imageFallback.ts
const POOLS: Record<string, string[]> = {
  nutrition: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9',
    'https://images.unsplash.com/photo-1543352634-8730a9b4e8b0',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
    'https://images.unsplash.com/photo-1464965911861-746a04b4bca6',
  ],
  weightloss: [
    'https://images.unsplash.com/photo-1506806732259-39c2d0268443',
    'https://images.unsplash.com/photo-1542144582-1ba00456b5ed',
    'https://images.unsplash.com/photo-1554344728-77cf90d9ed26',
    'https://images.unsplash.com/photo-1571019613914-85f342c55f57',
  ],
  protein: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
  ],
  cardio: [
    'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03',
    'https://images.unsplash.com/photo-1546483875-ad9014c88eba',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2',
  ],
  diabetes: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1517957743400-1d077972d96e',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67',
  ],
  cholesterol: [
    'https://images.unsplash.com/photo-1467453678174-768ec283a940',
    'https://images.unsplash.com/photo-1516822003754-cca485356ecb',
    'https://images.unsplash.com/photo-1542736667-069246bdbc74',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    'https://images.unsplash.com/photo-1521805103424-d8f8430e8931',
    'https://images.unsplash.com/photo-1579758629938-03607ccdbaba',
  ],
};

export const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea';

// hash ổn định từ chuỗi
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h >>> 0);
}

export function detectTopic(title = ''): keyof typeof POOLS {
  const t = title.toLowerCase();
  if (t.includes('tiểu đường') || t.includes('đái tháo đường') || t.includes('diabetes')) return 'diabetes';
  if (t.includes('cholesterol') || t.includes('mỡ máu')) return 'cholesterol';
  if (t.includes('huyết áp') || t.includes('tim mạch') || t.includes('cardio')) return 'cardio';
  if (t.includes('giảm cân') || t.includes('giảm mỡ') || t.includes('fat')) return 'weightloss';
  if (t.includes('protein') || t.includes('đạm')) return 'protein';
  if (t.includes('tập') || t.includes('workout') || t.includes('fitness')) return 'fitness';
  return 'nutrition';
}

/** Ảnh fallback đa dạng, ổn định theo (title + host) + có cache-buster */
export function variedFallbackBy(title?: string, host?: string): string {
  const topic = detectTopic(title || '');
  const pool = POOLS[topic] || [];
  if (!pool.length) return DEFAULT_FALLBACK;

  const key = `${(title || '').trim()}|${(host || '').trim()}`;
  const idx = hash(key) % pool.length;
  const sig = hash(`${key}:${idx}`); // cache-buster

  return `${pool[idx]}?auto=format&fit=crop&w=1200&q=80&sig=${sig}`;
}

