import { useState } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTasksQuery } from '@/features/tasks/api';
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '@/features/tasks/model';
import { TaskList } from '@/features/tasks/task-list';

type StatusFilter = TaskStatus | 'all';

/** Page components own data fetching; feature components stay presentational. */
export function TasksPage() {
  const { data: tasks, isLoading, isError, refetch } = useGetTasksQuery();
  const [status, setStatus] = useState<StatusFilter>('all');

  const visibleTasks = tasks?.filter((task) => status === 'all' || task.status === status);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button asChild>
          <Link to="/tasks/new">New task</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="status-filter">Filter by status</Label>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
          }}
        >
          <SelectTrigger id="status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TASK_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {TASK_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading tasks">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load tasks</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {visibleTasks && <TaskList tasks={visibleTasks} />}
    </section>
  );
}
