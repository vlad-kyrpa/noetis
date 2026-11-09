import type { HttpQuery } from '../../../common/api/types';
import type { TaskListQuery } from '../types';

// Tag labels cannot contain commas (the search syntax rejects them), so joining is lossless.
const TAG_QUERY_SEPARATOR = ',';

// Serializes a task list query to scalar query values; absent fields are left out.
export const toTaskHttpQuery = ({
  dueFrom,
  dueUntil,
  tags,
  title,
  viewId,
}: TaskListQuery): HttpQuery => ({
  dueFrom,
  dueUntil,
  tags: tags === undefined || tags.length === 0 ? undefined : tags.join(TAG_QUERY_SEPARATOR),
  title,
  viewId,
});
