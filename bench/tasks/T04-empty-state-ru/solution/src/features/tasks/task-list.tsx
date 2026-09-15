import { Link } from 'react-router';

import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteTaskButton } from '@/features/tasks/delete-task-button';
import type { Task } from '@/features/tasks/model';
import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/task-badges';

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <EmptyState title="No tasks yet" description="Create the first one." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell>
              <TaskPriorityBadge priority={task.priority} />
            </TableCell>
            <TableCell className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/tasks/${task.id}/edit`}>Edit</Link>
              </Button>
              <DeleteTaskButton task={task} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
