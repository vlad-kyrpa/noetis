import { addDays, toUtcMidnight } from '../../../common/regional/iso-date';
import { DAYS_IN_WEEK } from '../../../common/regional/weeks';
import type { DayGroup, GroupTasksByDayParams } from '../types';

// Day headings: locale weekday plus the date, read in UTC because dates are UTC midnights.
const DAY_HEADING_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  weekday: 'long',
};

// Splits a week's tasks into seven day sections in regional order; empty days are kept so the
// week always reads as a full calendar.
export const groupTasksByDay = ({
  locale,
  range,
  tasks,
}: GroupTasksByDayParams): readonly DayGroup[] => {
  const headingFormatter = new Intl.DateTimeFormat(locale, DAY_HEADING_FORMAT);

  return Array.from({ length: DAYS_IN_WEEK }, (_, offset) =>
    addDays({ date: range.from, days: offset }),
  ).map((date) => ({
    date,
    label: headingFormatter.format(toUtcMidnight(date)),
    tasks: tasks.filter((task) => task.dueTo === date),
  }));
};
