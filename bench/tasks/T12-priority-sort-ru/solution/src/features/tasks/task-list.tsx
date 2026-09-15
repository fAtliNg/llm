import { Link } from 'react-router';

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
import { TASK_PRIORITIES, type Task } from '@/features/tasks/model';
import { TaskPriorityBadge, TaskStatusBadge } from '@/features/tasks/task-badges';

// TASK_PRIORITIES is ordered low → high, so a larger index means a higher priority.
const priorityRank = (task: Task) => TASK_PRIORITIES.indexOf(task.priority);

export function TaskList({ tasks }: { tasks: Task[] }) {
  // Array.prototype.toSorted is stable, so ties keep the API order.
  const sorted = tasks.toSorted((a, b) => priorityRank(b) - priorityRank(a));

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks yet. Create the first one.</p>;
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
        {sorted.map((task) => (
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
