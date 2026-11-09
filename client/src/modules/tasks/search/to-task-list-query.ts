import type { SearchQuery } from '../../../common/search/types';
import type { TaskListQuery } from '../types';

// Maps a parsed search to task filters: text matches the title, tags must all be present.
export const toSearchTaskListQuery = ({ tags, text }: SearchQuery): TaskListQuery => ({
  ...(text === null ? {} : { title: text }),
  ...(tags.length === 0 ? {} : { tags }),
});
