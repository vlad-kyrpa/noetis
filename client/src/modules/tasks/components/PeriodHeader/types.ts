import type { PeriodDirection, PeriodSelection } from '../../types';

export interface PeriodHeaderProps {
  readonly headingId: string;
  readonly onStep: (direction: PeriodDirection) => void;
  readonly selection: PeriodSelection;
}
