import { useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRegional } from '../../../common/regional/useRegional';
import type { PeriodDirection, ViewSelectionState } from '../types';
import { isPeriodSelection, shiftSelection } from '../views/periods';
import { PERIOD_DATE_PARAM, createPeriodSearchParams } from '../views/view-path';
import { resolveViewSelection } from '../views/view-selection';

// Only mounted under `views/:viewId`, so a missing param means the route table is broken.
const MISSING_VIEW_ID = '';

// Reads the open view from the URL (`:viewId` + `?date=`) and regional settings. The URL is the
// state: `step` writes a new `?date=`, which pushes a history entry so browser back works.
export function useViewSelection(): ViewSelectionState {
  const { viewId = MISSING_VIEW_ID } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clock, settings } = useRegional();
  const dateParam = searchParams.get(PERIOD_DATE_PARAM);
  const today = clock.today();
  const { firstDayOfWeek } = settings;

  const selection = useMemo(
    () => resolveViewSelection({ dateParam, firstDayOfWeek, today, viewId }),
    [dateParam, firstDayOfWeek, today, viewId],
  );

  const step = useCallback(
    (direction: PeriodDirection): void => {
      if (isPeriodSelection(selection)) {
        setSearchParams(createPeriodSearchParams(shiftSelection({ direction, selection }).anchor));
      }
    },
    [selection, setSearchParams],
  );

  return { selection, step, viewId };
}
