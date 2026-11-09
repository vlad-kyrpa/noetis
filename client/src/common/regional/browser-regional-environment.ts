import type { RegionalEnvironment } from './types';

// Week info is newer than the TypeScript DOM lib: a method in current engines, a getter before.
interface WeekInfo {
  readonly firstDay: number;
}

interface LocaleWeekInfo {
  readonly getWeekInfo?: () => WeekInfo;
  readonly weekInfo?: WeekInfo;
}

// Reads the first day of the week the engine reports for a locale, if it reports one at all.
const readWeekInfoFirstDay = (language: string): number | undefined => {
  try {
    const locale = new Intl.Locale(language) as Intl.Locale & LocaleWeekInfo;
    const weekInfo = locale.getWeekInfo?.() ?? locale.weekInfo;

    return weekInfo?.firstDay;
  } catch {
    // An unparseable language tag just means "no week info"; settings fall back to Monday.
    return undefined;
  }
};

// Reads locale, time zone and week start from the browser. Called once at the composition root.
export const readBrowserRegionalEnvironment = (): RegionalEnvironment => {
  const language = navigator.language;

  return {
    language,
    resolvedTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekInfoFirstDay: readWeekInfoFirstDay(language),
  };
};
