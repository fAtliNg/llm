import { Badge } from '@/components/ui/badge';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from '@/features/tasks/model';

const statusVariant: Record<TaskStatus, 'outline' | 'secondary' | 'default'> = {
  todo: 'outline',
  in_progress: 'default',
  done: 'secondary',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={statusVariant[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

const priorityVariant: Record<TaskPriority, 'outline' | 'secondary' | 'destructive'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'destructive',
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={priorityVariant[priority]}>{TASK_PRIORITY_LABELS[priority]}</Badge>;
}
