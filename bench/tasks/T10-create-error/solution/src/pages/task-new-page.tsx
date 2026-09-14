import { useNavigate } from 'react-router';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { useCreateTaskMutation } from '@/features/tasks/api';
import type { TaskInput } from '@/features/tasks/model';
import { TaskForm } from '@/features/tasks/task-form';

export function TaskNewPage() {
  const navigate = useNavigate();
  const [createTask, { isError }] = useCreateTaskMutation();

  async function handleSubmit(values: TaskInput) {
    try {
      await createTask(values).unwrap();
    } catch {
      // The mutation's isError drives the message below; the form keeps its values.
      return;
    }
    await navigate('/');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New task</h1>
      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not save the task</AlertTitle>
        </Alert>
      )}
      <TaskForm onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
