import { addDays, toUtcMidnight } from '../../../common/regional/iso-date';
import type { DateRange } from '../../../common/regional/types';
import { DAYS_IN_WEEK } from '../../../common/regional/weeks';
import { ViewKind } from '../types';
import type {
  FormatPeriodTitleParams,
  PeriodDefinition,
  PeriodSelection,
  PeriodViewKind,
  ShiftSelectionParams,
  ViewSelection,
} from '../types';

// Dates are UTC-midnight instants, so formatting must stay in UTC to show the same day.
const DATE_FORMAT_TIME_ZONE = 'UTC';

// How far ◀ / ▶ move and what they are called, per period kind.
export const TIME_PERIOD_DEFINITIONS: Readonly<Record<PeriodViewKind, PeriodDefinition>> = {
  [ViewKind.Day]: { nextLabel: 'next day', previousLabel: 'previous day', stepDays: 1 },
  [ViewKind.Week]: {
    nextLabel: 'next week',
    previousLabel: 'previous week',
    stepDays: DAYS_IN_WEEK,
  },
};

// Builds the header formatter per period: a full day, or a day range collapsed by `formatRange`.
const TIME_PERIOD_TITLE_FORMATS: Readonly<Record<PeriodViewKind, Intl.DateTimeFormatOptions>> = {
  [ViewKind.Day]: {
    day: 'numeric',
    month: 'short',
    timeZone: DATE_FORMAT_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
  },
  [ViewKind.Week]: {
    day: 'numeric',
    month: 'short',
    timeZone: DATE_FORMAT_TIME_ZONE,
    year: 'numeric',
  },
};

// Narrows a selection to Day or Week, the kinds with a date range and a period header.
export const isPeriodSelection = (selection: ViewSelection): selection is PeriodSelection =>
  selection.kind === ViewKind.Day || selection.kind === ViewKind.Week;

// Day covers its anchor; Week covers seven days from its (already snapped) anchor.
export const resolvePeriodRange = ({ anchor, kind }: PeriodSelection): DateRange => ({
  from: anchor,
  until: addDays({ date: anchor, days: TIME_PERIOD_DEFINITIONS[kind].stepDays - 1 }),
});

// Steps a Day by one day or a Week by seven, keeping Week anchored on its first day.
export const shiftSelection = ({
  direction,
  selection,
}: ShiftSelectionParams): PeriodSelection => ({
  anchor: addDays({
    date: selection.anchor,
    days: direction * TIME_PERIOD_DEFINITIONS[selection.kind].stepDays,
  }),
  kind: selection.kind,
});

// Formats the period header in the regional locale: "Saturday, 7 Nov 2026" or "2 – 8 Nov 2026".
export const formatPeriodTitle = ({ locale, selection }: FormatPeriodTitleParams): string => {
  const formatter = new Intl.DateTimeFormat(locale, TIME_PERIOD_TITLE_FORMATS[selection.kind]);
  const { from, until } = resolvePeriodRange(selection);

  return from === until
    ? formatter.format(toUtcMidnight(from))
    : formatter.formatRange(toUtcMidnight(from), toUtcMidnight(until));
};
