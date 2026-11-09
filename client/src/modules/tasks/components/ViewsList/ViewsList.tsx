import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../../../../common/components/Button/Button';
import { Checkbox } from '../../../../common/components/Checkbox/Checkbox';
import { CheckboxState } from '../../../../common/components/Checkbox/types';
import { Message } from '../../../../common/components/Message/Message';
import { MessageTone } from '../../../../common/components/Message/types';
import { Text } from '../../../../common/components/Text/Text';
import { LoadState } from '../../types';
import { ORDERED_BUILT_IN_VIEWS } from '../../views/built-in-views';
import { createTaskViewPath } from '../../views/view-path';
import type {
  CustomViewsSectionProps,
  ViewsListItemContentProps,
  ViewsListItemProps,
  ViewsListProps,
} from './types';
import './ViewsList.css';

const TAG_PREFIX = '#';
const NO_TAGS: readonly string[] = [];
const LOADING_MESSAGE = 'loading views…';
const FAILURE_MESSAGE = 'Could not load your views.';
const EMPTY_MESSAGE = 'no views yet — use + to create one';

// One view row; NavLink exposes the open view via `aria-current` and the checkbox mirrors it visually.
function ViewsListItem({ label, tags, viewId }: ViewsListItemProps): ReactElement {
  return (
    <li>
      <NavLink className="views-list-link" to={createTaskViewPath(viewId)}>
        {({ isActive }) => <ViewsListItemContent isActive={isActive} label={label} tags={tags} />}
      </NavLink>
    </li>
  );
}

// Selection marker, title, and tags of a view row, rendered once the active state is known.
function ViewsListItemContent({ isActive, label, tags }: ViewsListItemContentProps): ReactElement {
  return (
    <>
      <Checkbox state={isActive ? CheckboxState.Checked : CheckboxState.Unchecked} />
      <span className="views-list-title">{label}</span>
      {tags.length > 0 && (
        <span className="views-list-tags">
          {tags.map((tag) => (
            <span className="views-list-tag" key={tag}>
              {`${TAG_PREFIX}${tag}`}
            </span>
          ))}
        </span>
      )}
    </>
  );
}

// Renders the saved views, or the loading, failure, or empty state in their place.
function CustomViewsSection({ onRetry, state, views }: CustomViewsSectionProps): ReactElement {
  if (state === LoadState.Failed) {
    return (
      <div className="views-list-status">
        <Message tone={MessageTone.Issue}>{FAILURE_MESSAGE}</Message>
        <Button onClick={onRetry} type="button">
          retry
        </Button>
      </div>
    );
  }

  const isFirstLoad = state === LoadState.Loading && views.length === 0;

  if (isFirstLoad) {
    return (
      <div className="views-list-status">
        <Message>{LOADING_MESSAGE}</Message>
      </div>
    );
  }

  if (views.length === 0) {
    return (
      <div className="views-list-status">
        <Text>{EMPTY_MESSAGE}</Text>
      </div>
    );
  }

  return (
    <ul aria-busy={state === LoadState.Loading} className="views-list-group">
      {views.map((view) => (
        <ViewsListItem key={view.id} label={view.title} tags={view.tags} viewId={view.id} />
      ))}
    </ul>
  );
}

// Lists the built-in views first and the user's saved task views below them.
export function ViewsList({
  customViews,
  customViewsState,
  onRetry,
}: ViewsListProps): ReactElement {
  return (
    <nav aria-label="task views" className="views-list">
      <ul className="views-list-group">
        {ORDERED_BUILT_IN_VIEWS.map((view) => (
          <ViewsListItem key={view.id} label={view.label} tags={NO_TAGS} viewId={view.id} />
        ))}
      </ul>
      <CustomViewsSection onRetry={onRetry} state={customViewsState} views={customViews} />
    </nav>
  );
}
