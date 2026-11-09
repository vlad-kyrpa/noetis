import { addDays, weekdayOf } from './iso-date';
import type { IsoDate, StartOfWeekParams } from './types';

export const DAYS_IN_WEEK = 7;

// Snaps a day back to the first day of its regional week (Monday- or Sunday-first, etc.).
export const startOfWeek = ({ date, firstDayOfWeek }: StartOfWeekParams): IsoDate =>
  addDays({ date, days: -((weekdayOf(date) - firstDayOfWeek + DAYS_IN_WEEK) % DAYS_IN_WEEK) });
