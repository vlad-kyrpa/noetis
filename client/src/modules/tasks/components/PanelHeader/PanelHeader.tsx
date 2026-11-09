import { ArrowLeft } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { SearchQueryChips } from '../../../../common/components/SearchQueryChips/SearchQueryChips';
import type { PanelHeaderProps } from './types';
import './PanelHeader.css';

const BACK_LABEL = 'back';

// Top of a task list panel: optional back link, title (or period header), actions slot, and
// the applied search with its ✕.
export function PanelHeader({
  actions,
  backTo,
  onClearSearch,
  search,
  title,
}: PanelHeaderProps): ReactElement {
  return (
    <header className="panel-header">
      <div className="panel-header-row">
        {backTo !== null && (
          <Link
            aria-label={BACK_LABEL}
            className="panel-header-back"
            title={BACK_LABEL}
            to={backTo}
          >
            <ArrowLeft aria-hidden="true" size="var(--icon-size-2)" />
          </Link>
        )}
        <div className="panel-header-title">{title}</div>
        {actions}
      </div>
      {search !== null && <SearchQueryChips onClear={onClearSearch} query={search} />}
    </header>
  );
}
