import { parseIsoDate, toUtcMidnight } from './iso-date';
import type { FormatIsoDateParams, FormatTimestampParams } from './types';

// Calendar days are UTC midnights, so they are formatted in UTC to show the stored day.
const CALENDAR_DAY_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
};

// Instants (created/updated) are shown as a short date and time in the regional time zone.
const TIMESTAMP_FORMAT: Omit<Intl.DateTimeFormatOptions, 'timeZone'> = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

// Formats a `YYYY-MM-DD` day for the locale, e.g. "7 Nov 2026"; unparseable input is shown raw.
export const formatIsoDate = ({ date, locale }: FormatIsoDateParams): string => {
  const day = parseIsoDate(date);

  return day === undefined
    ? date
    : new Intl.DateTimeFormat(locale, CALENDAR_DAY_FORMAT).format(toUtcMidnight(day));
};

// Formats an ISO timestamp in the regional time zone, e.g. "7 Nov 2026, 14:05".
export const formatTimestamp = ({ locale, timeZone, timestamp }: FormatTimestampParams): string => {
  const instant = new Date(timestamp);

  return Number.isNaN(instant.getTime())
    ? timestamp
    : new Intl.DateTimeFormat(locale, { ...TIMESTAMP_FORMAT, timeZone }).format(instant);
};
