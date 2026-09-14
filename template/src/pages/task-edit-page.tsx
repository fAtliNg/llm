import { useNavigate, useParams } from 'react-router';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTaskQuery, useUpdateTaskMutation } from '@/features/tasks/api';
import type { TaskInput } from '@/features/tasks/model';
import { TaskForm } from '@/features/tasks/task-form';

export function TaskEditPage() {
  const { taskId = '' } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading, isError } = useGetTaskQuery(taskId, { skip: taskId === '' });
  const [updateTask] = useUpdateTaskMutation();

  async function handleSubmit(values: TaskInput) {
    await updateTask({ id: taskId, patch: values }).unwrap();
    await navigate('/');
  }

  if (isLoading) {
    return <Skeleton className="h-64 max-w-lg" aria-label="Loading task" />;
  }

  if (isError || !task) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Task not found</AlertTitle>
      </Alert>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit task</h1>
      <TaskForm defaultValues={task} onSubmit={handleSubmit} />
    </section>
  );
}
