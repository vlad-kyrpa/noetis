import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Heading } from '../../../common/components/Heading/Heading';
import { HeadingScale } from '../../../common/components/Heading/types';
import { LayoutScale } from '../../../common/components/Layout/types';
import { useLayout } from '../../../common/hooks/useLayout';
import { useRegional } from '../../../common/regional/useRegional';
import { routes } from '../../../routes';
import { PanelHeader } from '../components/PanelHeader/PanelHeader';
import { PeriodHeader } from '../components/PeriodHeader/PeriodHeader';
import { TaskList } from '../components/TaskList/TaskList';
import { ViewActions } from '../components/ViewActions/ViewActions';
import { useTaskList } from '../hooks/useTaskList';
import { useTasksOutletContext } from '../hooks/useTasksOutletContext';
import { useViewSelection } from '../hooks/useViewSelection';
import { mergeTaskListQueries } from '../search/merge-queries';
import { searchForScope } from '../search/scope';
import { toSearchTaskListQuery } from '../search/to-task-list-query';
import { BuiltInViewId, LoadState, ViewKind } from '../types';
import type { TaskViewsSnapshot, ViewSelection } from '../types';
import { BUILT_IN_VIEWS } from '../views/built-in-views';
import { groupTasksByDay } from '../views/group-by-day';
import { isPeriodSelection, resolvePeriodRange } from '../views/periods';
import { toTaskListQuery } from '../views/task-list-query';
import './TaskPanel.css';

const PANEL_HEADING_ID = 'task-panel-title';
const NO_SUBMISSION = 0;
const EMPTY_VIEW_MESSAGE = 'no tasks';
const EMPTY_SEARCH_MESSAGE = 'nothing found';
const LOADING_TITLE = 'loading view…';
const MISSING_VIEW_TITLE = 'view not found';

interface ResolveViewTitleParams {
  readonly selection: ViewSelection;
  readonly views: TaskViewsSnapshot;
}

// Names a non-period view: the built-in label, or the saved view's title once the list is in.
const resolveViewTitle = ({ selection, views }: ResolveViewTitleParams): string => {
  if (selection.kind !== ViewKind.Custom) {
    return BUILT_IN_VIEWS[BuiltInViewId.All].label;
  }

  const savedView = views.views.find((view) => view.id === selection.viewId);

  if (savedView !== undefined) {
    return savedView.title;
  }

  return views.state === LoadState.Loading ? LOADING_TITLE : MISSING_VIEW_TITLE;
};

// One open view's tasks. The view's filters and (when submitted here) the search are merged
// into a single request; Day/Week get a period header, Week groups rows by day, custom views
// get the view actions menu.
export function ViewTasksPage(): ReactElement {
  const { activeSearch, clearSearch, views } = useTasksOutletContext();
  const { selection, step, viewId } = useViewSelection();
  const { settings } = useRegional();
  const isSplit = useLayout() !== LayoutScale.Mobile;
  const search = searchForScope({ active: activeSearch, scope: viewId });
  const submission = search === null ? NO_SUBMISSION : (activeSearch?.submission ?? NO_SUBMISSION);

  const query = useMemo(
    () =>
      mergeTaskListQueries({
        search: search === null ? null : toSearchTaskListQuery(search),
        view: toTaskListQuery(selection),
      }),
    [search, selection],
  );
  const taskList = useTaskList({ query, submission });

  const dayGroups = useMemo(
    () =>
      selection.kind === ViewKind.Week
        ? groupTasksByDay({
            locale: settings.locale,
            range: resolvePeriodRange(selection),
            tasks: taskList.tasks,
          })
        : null,
    [selection, settings.locale, taskList.tasks],
  );

  const title = isPeriodSelection(selection) ? (
    <PeriodHeader headingId={PANEL_HEADING_ID} onStep={step} selection={selection} />
  ) : (
    <Heading id={PANEL_HEADING_ID} scale={HeadingScale.Subsection}>
      {resolveViewTitle({ selection, views })}
    </Heading>
  );

  return (
    <section aria-labelledby={PANEL_HEADING_ID} className="task-panel">
      <PanelHeader
        actions={selection.kind === ViewKind.Custom ? <ViewActions /> : null}
        backTo={isSplit ? null : routes.tasks.root}
        onClearSearch={clearSearch}
        search={search}
        title={title}
      />
      <TaskList
        dayGroups={dayGroups}
        emptyMessage={search === null ? EMPTY_VIEW_MESSAGE : EMPTY_SEARCH_MESSAGE}
        isDueDateShown={selection.kind !== ViewKind.Day}
        onRetry={taskList.reload}
        state={taskList.state}
        tasks={taskList.tasks}
      />
    </section>
  );
}
