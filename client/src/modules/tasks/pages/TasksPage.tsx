import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useOutlet } from 'react-router-dom';
import { Heading } from '../../../common/components/Heading/Heading';
import { HeadingScale } from '../../../common/components/Heading/types';
import { LayoutScale } from '../../../common/components/Layout/types';
import { SearchBar } from '../../../common/components/SearchBar/SearchBar';
import { useLayout } from '../../../common/hooks/useLayout';
import { ViewsList } from '../components/ViewsList/ViewsList';
import { useIsTaskDetailsOpen } from '../hooks/useIsTaskDetailsOpen';
import { useTaskSearch } from '../hooks/useTaskSearch';
import { useTaskViews } from '../hooks/useTaskViews';
import type { TasksOutletContext } from '../types';
import { NoViewSelected } from './NoViewSelected';
import './TasksPage.css';

const SEARCH_INPUT_ID = 'tasks-search';
const SEARCH_PLACEHOLDER = '#tag some text';

// Shell of the tasks area: the search bar over everything, then the views list and the open
// panel. Tablet and PC split the page in half; mobile, and any layout showing a task's details,
// shows either the list or the panel.
export function TasksPage(): ReactElement {
  const { reload, state, views } = useTaskViews();
  const { active, clear, inputState } = useTaskSearch();
  const isTaskDetailsOpen = useIsTaskDetailsOpen();
  // A task's details are long-form writing, so they take the full width on every layout.
  const hasSplitPanes = useLayout() !== LayoutScale.Mobile && !isTaskDetailsOpen;

  const outletContext = useMemo<TasksOutletContext>(
    () => ({
      activeSearch: active,
      clearSearch: clear,
      reloadViews: reload,
      views: { state, views },
    }),
    [active, clear, reload, state, views],
  );
  const panel = useOutlet(outletContext);
  const viewsList = <ViewsList customViews={views} customViewsState={state} onRetry={reload} />;

  return (
    <section aria-labelledby="tasks-page-title" className="tasks-page">
      <header className="tasks-page-header">
        <Heading id="tasks-page-title" scale={HeadingScale.Page}>
          tasks
        </Heading>
      </header>
      <SearchBar
        failureMessage={inputState.failureMessage}
        id={SEARCH_INPUT_ID}
        label="search tasks"
        onChange={inputState.setInput}
        onSubmit={inputState.submit}
        placeholder={SEARCH_PLACEHOLDER}
        value={inputState.input}
      />
      {hasSplitPanes ? (
        <div className="tasks-page-split">
          <div className="tasks-page-column">{viewsList}</div>
          <div className="tasks-page-column">{panel ?? <NoViewSelected />}</div>
        </div>
      ) : (
        (panel ?? viewsList)
      )}
    </section>
  );
}
