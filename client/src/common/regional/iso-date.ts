import { Weekday } from './types';
import type { AddDaysParams, IsoDate } from './types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_LENGTH = 10;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const UTC_MIDNIGHT_SUFFIX = 'T00:00:00.000Z';
// `Date#getUTCDay` counts Sunday as 0; ISO weekdays count it as 7.
const JS_SUNDAY = 0;

// Reads the calendar day a UTC instant falls on.
const formatUtcDay = (instant: Date): string => instant.toISOString().slice(0, ISO_DATE_LENGTH);

// Turns a day into its UTC midnight, so day arithmetic never meets a DST shift.
export const toUtcMidnight = (date: IsoDate): Date => new Date(`${date}${UTC_MIDNIGHT_SUFFIX}`);

// Accepts only real calendar days: the pattern rejects shapes, the round trip rejects `02-30`.
export const parseIsoDate = (candidate: string): IsoDate | undefined => {
  if (!ISO_DATE_PATTERN.test(candidate)) {
    return undefined;
  }

  const instant = new Date(`${candidate}${UTC_MIDNIGHT_SUFFIX}`);
  const isRealDay = !Number.isNaN(instant.getTime()) && formatUtcDay(instant) === candidate;

  return isRealDay ? (candidate as IsoDate) : undefined;
};

// Steps a day forward or back in UTC, so DST transitions can never skip or repeat a day.
export const addDays = ({ date, days }: AddDaysParams): IsoDate =>
  formatUtcDay(new Date(toUtcMidnight(date).getTime() + days * MILLISECONDS_PER_DAY)) as IsoDate;

// Gives the ISO weekday of a day, independent of the viewer's time zone.
export const weekdayOf = (date: IsoDate): Weekday => {
  const jsWeekday = toUtcMidnight(date).getUTCDay();

  return jsWeekday === JS_SUNDAY ? Weekday.Sunday : jsWeekday;
};
