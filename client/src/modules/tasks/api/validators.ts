import type { HttpValidationIssues } from '../../../common/api/types';
import type { RemoveTasksInput, TaskInput } from '../types';

// Mirrors the backend rule that a task needs a non-blank title, so the request is never sent.
export const validateTaskInput = ({ title }: TaskInput): HttpValidationIssues =>
  title.trim() === '' ? { title: 'Enter a task title.' } : {};

// Stops an empty delete from reaching the backend.
export const validateRemoveTasks = ({ ids }: RemoveTasksInput): HttpValidationIssues =>
  ids.length === 0 ? { ids: 'Select at least one task.' } : {};
