import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Project } from '@/features/projects/model';

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects yet. Add the first one.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Deadline</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>{project.deadline}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
