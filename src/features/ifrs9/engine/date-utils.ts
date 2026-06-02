export const MS_PER_DAY = 86_400_000;
export const MS_PER_MONTH = MS_PER_DAY * 30.4375;

export const monthsBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / MS_PER_MONTH);

export const daysBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
