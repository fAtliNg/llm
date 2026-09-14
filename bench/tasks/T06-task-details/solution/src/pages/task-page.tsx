import { Link, useParams } from 'react-router';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTaskQuery } from '@/features/tasks/api';
import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/task-badges';

export function TaskPage() {
  const { taskId = '' } = useParams<{ taskId: string }>();
  const { data: task, isLoading, isError } = useGetTaskQuery(taskId, { skip: taskId === '' });

  if (isLoading) {
    return <Skeleton className="h-40 max-w-lg" aria-label="Loading task" />;
  }

  if (isError || !task) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Task not found</AlertTitle>
      </Alert>
    );
  }

  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{task.title}</h1>
        <Button asChild variant="outline">
          <Link to={`/tasks/${task.id}/edit`}>Edit</Link>
        </Button>
      </div>
      <div className="flex gap-2">
        <TaskStatusBadge status={task.status} />
        <TaskPriorityBadge priority={task.priority} />
      </div>
      {task.description && <p className="text-muted-foreground">{task.description}</p>}
    </article>
  );
}
