import { z } from 'zod';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

/** What the user fills in. Shared by the create form, the edit form and the API payloads. */
export const taskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Keep the title under 120 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Add at least 10 characters')
    .max(500, 'Keep the description under 500 characters'),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
});

export type TaskInput = z.infer<typeof taskInputSchema>;

/** What the API returns. */
export const taskSchema = taskInputSchema.extend({
  id: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

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
