import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from '../../../../common/components/Button/Button';
import { Heading } from '../../../../common/components/Heading/Heading';
import { HeadingScale } from '../../../../common/components/Heading/types';
import { useRegional } from '../../../../common/regional/useRegional';
import { PeriodDirection } from '../../types';
import { TIME_PERIOD_DEFINITIONS, formatPeriodTitle } from '../../views/periods';
import type { PeriodHeaderProps } from './types';
import './PeriodHeader.css';

// "◀ Saturday, 7 Nov 2026 ▶": the regional period title between previous/next steps.
export function PeriodHeader({ headingId, onStep, selection }: PeriodHeaderProps): ReactElement {
  const { settings } = useRegional();
  const { nextLabel, previousLabel } = TIME_PERIOD_DEFINITIONS[selection.kind];
  const title = formatPeriodTitle({ locale: settings.locale, selection });

  return (
    <div className="period-header">
      <Button
        aria-label={previousLabel}
        onClick={() => onStep(PeriodDirection.Previous)}
        title={previousLabel}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size="var(--icon-size-2)" />
      </Button>
      <Heading id={headingId} scale={HeadingScale.Subsection}>
        {title}
      </Heading>
      <Button
        aria-label={nextLabel}
        onClick={() => onStep(PeriodDirection.Next)}
        title={nextLabel}
        type="button"
      >
        <ChevronRight aria-hidden="true" size="var(--icon-size-2)" />
      </Button>
    </div>
  );
}
