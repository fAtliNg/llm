import type { TaskPriority, TaskStatus } from '@shared/tasks';

/** The data contract lives in `shared/tasks.ts`; this file adds what only the UI needs. */
export * from '@shared/tasks';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
