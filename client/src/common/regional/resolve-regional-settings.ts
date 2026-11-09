import { Weekday } from './types';
import type { RegionalEnvironment, RegionalSettings } from './types';

// Firefox has no `Intl.Locale` week info yet; Monday is the most common first day.
const FALLBACK_FIRST_DAY_OF_WEEK = Weekday.Monday;

// Narrows the engine-reported first day to a known weekday.
const isWeekday = (candidate: number | undefined): candidate is Weekday =>
  candidate !== undefined &&
  Number.isInteger(candidate) &&
  candidate >= Weekday.Monday &&
  candidate <= Weekday.Sunday;

// Turns raw browser readings into settings, applying the first-day fallback.
export const resolveRegionalSettings = ({
  language,
  resolvedTimeZone,
  weekInfoFirstDay,
}: RegionalEnvironment): RegionalSettings => ({
  firstDayOfWeek: isWeekday(weekInfoFirstDay) ? weekInfoFirstDay : FALLBACK_FIRST_DAY_OF_WEEK,
  locale: language,
  timeZone: resolvedTimeZone,
});
