import { useMemo } from 'react';
import type { IngredientResponse } from '../types/food.type';
import { safeNum } from '../helpers/number.helper';

type Totals = {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  sugarMg: number;
};

export default function useNutritionTotals(
  items: (IngredientResponse & { qty: string })[],
) {
  return useMemo<Totals>(() => {
    const sum: Totals = {
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
      fiberG: 0,
      sodiumMg: 0,
      sugarMg: 0,
    };
    for (const it of items) {
      const qty = Number(it.qty);
      const ratio = Number.isFinite(qty) && qty > 0 ? qty / 100 : 0;
      sum.kcal += safeNum(it.per100?.kcal) * ratio;
      sum.proteinG += safeNum(it.per100?.proteinG) * ratio;
      sum.carbG += safeNum(it.per100?.carbG) * ratio;
      sum.fatG += safeNum(it.per100?.fatG) * ratio;
      sum.fiberG += safeNum(it.per100?.fiberG) * ratio;
      sum.sodiumMg += safeNum(it.per100?.sodiumMg) * ratio;
      sum.sugarMg += safeNum(it.per100?.sugarMg) * ratio;
    }
    return sum;
  }, [items]);
}
