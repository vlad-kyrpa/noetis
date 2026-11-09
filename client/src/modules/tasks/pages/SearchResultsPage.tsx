import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Heading } from '../../../common/components/Heading/Heading';
import { HeadingScale } from '../../../common/components/Heading/types';
import { LayoutScale } from '../../../common/components/Layout/types';
import { Text } from '../../../common/components/Text/Text';
import { useLayout } from '../../../common/hooks/useLayout';
import { routes } from '../../../routes';
import { PanelHeader } from '../components/PanelHeader/PanelHeader';
import { TaskList } from '../components/TaskList/TaskList';
import { useTaskList } from '../hooks/useTaskList';
import { useTasksOutletContext } from '../hooks/useTasksOutletContext';
import { GLOBAL_SEARCH_SCOPE, searchForScope } from '../search/scope';
import { toSearchTaskListQuery } from '../search/to-task-list-query';
import './TaskPanel.css';

const PANEL_HEADING_ID = 'search-results-title';
const NO_SUBMISSION = 0;
const EMPTY_MESSAGE = 'nothing found';
const NO_SEARCH_MESSAGE = 'enter a search above, e.g. #work review';

// Results of a search run with no view open. The active search is page state, so after a
// reload this page has nothing to show until the next submit.
export function SearchResultsPage(): ReactElement {
  const { activeSearch, clearSearch } = useTasksOutletContext();
  const isSplit = useLayout() !== LayoutScale.Mobile;
  const search = searchForScope({ active: activeSearch, scope: GLOBAL_SEARCH_SCOPE });
  const query = useMemo(() => (search === null ? null : toSearchTaskListQuery(search)), [search]);
  const submission = search === null ? NO_SUBMISSION : (activeSearch?.submission ?? NO_SUBMISSION);
  const taskList = useTaskList({ query, submission });

  return (
    <section aria-labelledby={PANEL_HEADING_ID} className="task-panel">
      <PanelHeader
        actions={null}
        backTo={isSplit ? null : routes.tasks.root}
        onClearSearch={clearSearch}
        search={search}
        title={
          <Heading id={PANEL_HEADING_ID} scale={HeadingScale.Subsection}>
            search results
          </Heading>
        }
      />
      {search === null ? (
        <div className="task-panel-empty">
          <Text>{NO_SEARCH_MESSAGE}</Text>
        </div>
      ) : (
        <TaskList
          dayGroups={null}
          emptyMessage={EMPTY_MESSAGE}
          isDueDateShown
          onRetry={taskList.reload}
          state={taskList.state}
          tasks={taskList.tasks}
        />
      )}
    </section>
  );
}
