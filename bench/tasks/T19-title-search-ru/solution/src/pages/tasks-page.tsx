import { useState } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTasksQuery } from '@/features/tasks/api';
import { TaskList } from '@/features/tasks/task-list';

/** Page components own data fetching; feature components stay presentational. */
export function TasksPage() {
  const { data: tasks, isLoading, isError, refetch } = useGetTasksQuery();
  const [query, setQuery] = useState('');

  const visibleTasks = tasks?.filter((task) =>
    task.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button asChild>
          <Link to="/tasks/new">New task</Link>
        </Button>
      </div>

      <div className="flex max-w-sm items-center gap-2">
        <Label htmlFor="task-search">Search</Label>
        <Input
          id="task-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
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
