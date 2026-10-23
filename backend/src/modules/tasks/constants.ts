import type { TaskStatus } from "./types";

/** Enumerates the only valid task status values for validators and clients. */
export const taskStatuses: readonly TaskStatus[] = [
  "undone",
  "inProgress",
  "done",
];

/** Identifies whether an untrusted value is a supported task status. */
export const isTaskStatus = (value: unknown): value is TaskStatus =>
  taskStatuses.some((status) => status === value);
