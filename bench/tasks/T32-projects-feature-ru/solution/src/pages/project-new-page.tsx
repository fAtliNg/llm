import { useNavigate } from 'react-router';

import { useCreateProjectMutation } from '@/features/projects/api';
import type { ProjectInput } from '@/features/projects/model';
import { ProjectForm } from '@/features/projects/project-form';

export function ProjectNewPage() {
  const navigate = useNavigate();
  const [createProject] = useCreateProjectMutation();

  async function handleSubmit(values: ProjectInput) {
    await createProject(values).unwrap();
    await navigate('/projects');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New project</h1>
      <ProjectForm onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
