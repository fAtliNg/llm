import { useNavigate } from 'react-router';

import { useCreateTaskMutation } from '@/features/tasks/api';
import { useGetProjectsQuery } from '@/features/projects/api';
import type { TaskInput } from '@/features/tasks/model';
import { TaskForm } from '@/features/tasks/task-form';

export function TaskNewPage() {
  const navigate = useNavigate();
  const { data: projects } = useGetProjectsQuery();
  const [createTask] = useCreateTaskMutation();

  async function handleSubmit(values: TaskInput) {
    await createTask(values).unwrap();
    await navigate('/');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New task</h1>
      <TaskForm projects={projects} onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
