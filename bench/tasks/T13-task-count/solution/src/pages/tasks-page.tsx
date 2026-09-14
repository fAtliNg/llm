import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTasksQuery } from '@/features/tasks/api';
import { TaskList } from '@/features/tasks/task-list';

/** Page components own data fetching; feature components stay presentational. */
export function TasksPage() {
  const { data: tasks, isLoading, isError, refetch } = useGetTasksQuery();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{tasks ? `Tasks (${tasks.length})` : 'Tasks'}</h1>
        <Button asChild>
          <Link to="/tasks/new">New task</Link>
        </Button>
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

      {tasks && <TaskList tasks={tasks} />}
    </section>
  );
}
