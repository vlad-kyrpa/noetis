import { parseIsoDate } from './iso-date';
import type { Clock, IsoDate, RegionalSettings } from './types';

// `en-CA` formats dates as `YYYY-MM-DD`, so the regional calendar day needs no reassembly.
const ISO_DAY_LOCALE = 'en-CA';

// Builds the clock for the regional time zone. Reading the system time is its only side effect.
export const createRegionalClock = ({ timeZone }: RegionalSettings): Clock => {
  const dayFormatter = new Intl.DateTimeFormat(ISO_DAY_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  });

  return {
    today: (): IsoDate => {
      const formatted = dayFormatter.format(new Date());
      const today = parseIsoDate(formatted);

      if (today === undefined) {
        throw new Error(`The regional clock produced an invalid date: ${formatted}`);
      }

      return today;
    },
  };
};
