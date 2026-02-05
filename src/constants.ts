import { Level, BaliseStatus } from './types';

// Time limit logic based on prompt
// 1 searching = 6 min (360s)
// 2 searching = 8 min (480s)
// 3+ searching = 10 min (600s)
export const getTimeLimitSeconds = (searchingCount: number): number => {
  if (searchingCount <= 0) return 0;
  if (searchingCount === 1) return 360;
  if (searchingCount === 2) return 480;
  return 600;
};

export const LEVEL_COLORS: Record<Level, string> = {
  N1: 'text-green-600 bg-green-50 border-green-200',
  N2: 'text-blue-600 bg-blue-50 border-blue-200',
  N3: 'text-purple-600 bg-purple-50 border-purple-200',
};

export const STATUS_COLORS: Record<BaliseStatus, string> = {
  inactive: 'border-slate-200 bg-white text-slate-500',
  searching: 'border-yellow-400 bg-yellow-50 text-yellow-800 shadow-[0_0_15px_rgba(250,204,21,0.3)]',
  found: 'border-emerald-500 bg-emerald-50 text-emerald-800',
  timeout: 'border-red-500 bg-red-50 text-red-800',
};

export const POINTS_PER_LEVEL: Record<Level, number> = {
  N1: 10,
  N2: 20,
  N3: 30,
};