import {
  decodeListOf,
  isNullableString,
  isRecord,
  isStringArray,
} from '../../../common/api/decoders';
import type { Decoder } from '../../../common/api/types';
import { TaskStatus } from '../types';
import type { Task, TaskId } from '../types';

const TASK_STATUSES: ReadonlySet<string> = new Set(Object.values(TaskStatus));

// Accepts only the status values the client knows how to render.
const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === 'string' && TASK_STATUSES.has(value);

// Accepts a task only when every field has its wire type, so components never see partial data.
export const decodeTask: Decoder<Task> = (value) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const { createdAt, description, dueTo, id, linkedNoteIds, linkedTaskIds } = value;
  const { status, tags, title, updatedAt, userId } = value;
  const hasIdentityFields = typeof id === 'string' && typeof userId === 'string';
  const hasTimestamps = typeof createdAt === 'string' && typeof updatedAt === 'string';
  const hasTextFields = hasIdentityFields && hasTimestamps && typeof title === 'string';
  const hasNullableFields = isNullableString(description) && isNullableString(dueTo);
  const hasListFields =
    isStringArray(linkedNoteIds) && isStringArray(linkedTaskIds) && isStringArray(tags);

  if (!hasTextFields || !hasNullableFields || !hasListFields || !isTaskStatus(status)) {
    return undefined;
  }

  return {
    createdAt,
    description,
    dueTo,
    id,
    linkedNoteIds,
    linkedTaskIds,
    status,
    tags,
    title,
    updatedAt,
    userId,
  };
};

export const decodeTaskList: Decoder<readonly Task[]> = decodeListOf(decodeTask);

// Reads the ids echoed back by the delete endpoint.
export const decodeRemovedTaskIds: Decoder<readonly TaskId[]> = (value) =>
  isRecord(value) && isStringArray(value.ids) ? value.ids : undefined;
