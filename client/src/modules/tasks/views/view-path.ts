import { generatePath } from 'react-router-dom';
import type { IsoDate } from '../../../common/regional/types';
import { routes } from '../../../routes';

// The query parameter anchoring Day and Week, e.g. `/tasks/views/day?date=2026-11-07`.
export const PERIOD_DATE_PARAM = 'date';

// Builds the route of one task view; built-in ids and custom UUIDs share the same segment.
export const createTaskViewPath = (viewId: string): string =>
  generatePath(routes.tasks.list, { viewId });

// Builds the route of one task's details panel.
export const createTaskDetailsPath = (taskId: string): string =>
  generatePath(routes.tasks.details, { taskId });

// Builds the query string that moves a period view to another anchor day.
export const createPeriodSearchParams = (anchor: IsoDate): URLSearchParams =>
  new URLSearchParams({ [PERIOD_DATE_PARAM]: anchor });
