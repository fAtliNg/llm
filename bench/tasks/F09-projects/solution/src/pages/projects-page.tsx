import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetProjectsQuery } from '@/features/projects/api';
import { ProjectList } from '@/features/projects/project-list';

export function ProjectsPage() {
  const { data: projects, isLoading, isError, refetch } = useGetProjectsQuery();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button asChild>
          <Link to="/projects/new">New project</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading projects">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load projects</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {projects && <ProjectList projects={projects} />}
    </section>
  );
}
