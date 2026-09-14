import { useNavigate } from 'react-router';

import { useCreateTaskMutation } from '@/features/tasks/api';
import type { TaskInput } from '@/features/tasks/model';
import { TaskForm } from '@/features/tasks/task-form';

export function TaskNewPage() {
  const navigate = useNavigate();
  const [createTask] = useCreateTaskMutation();

  async function handleSubmit(values: TaskInput) {
    await createTask(values).unwrap();
    await navigate('/');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New task</h1>
      <TaskForm onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
