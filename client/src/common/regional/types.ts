import type { ReactNode } from 'react';

declare const isoDateBrand: unique symbol;

// A real calendar day as `YYYY-MM-DD`. Only the iso-date helpers create it, so holding one means
// the string was validated; ISO dates also compare correctly as plain strings.
export type IsoDate = string & { readonly [isoDateBrand]: true };

// Inclusive on both ends, matching the backend's `dueFrom` / `dueUntil`.
export interface DateRange {
  readonly from: IsoDate;
  readonly until: IsoDate;
}

// ISO numbering, the same values as `Intl.Locale` week info `firstDay`.
export enum Weekday {
  Monday = 1,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

// How dates are shown and where weeks start; browser defaults today, user settings later.
export interface RegionalSettings {
  readonly firstDayOfWeek: Weekday;
  readonly locale: string;
  readonly timeZone: string;
}

// The raw browser readings `resolveRegionalSettings` turns into settings.
export interface RegionalEnvironment {
  readonly language: string;
  readonly resolvedTimeZone: string;
  readonly weekInfoFirstDay: number | undefined;
}

// The one impure seam for "now": the calendar date in the regional time zone.
export interface Clock {
  readonly today: () => IsoDate;
}

export interface RegionalContextValue {
  readonly clock: Clock;
  readonly settings: RegionalSettings;
}

export interface RegionalProviderProps extends RegionalContextValue {
  readonly children: ReactNode;
}

export interface AddDaysParams {
  readonly date: IsoDate;
  readonly days: number;
}

export interface FormatIsoDateParams {
  // A `YYYY-MM-DD` string as sent over the wire; not trusted to be valid.
  readonly date: string;
  readonly locale: string;
}

export interface FormatTimestampParams {
  readonly locale: string;
  readonly timeZone: string;
  // An ISO 8601 instant, e.g. `createdAt`.
  readonly timestamp: string;
}

export interface StartOfWeekParams {
  readonly date: IsoDate;
  readonly firstDayOfWeek: Weekday;
}
