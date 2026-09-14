import { Button } from '@/components/ui/button';
import { useUpdateTaskMutation } from '@/features/tasks/api';
import type { Task } from '@/features/tasks/model';

/** One-click completion. The invalidated tag refreshes the list, so no local state is needed. */
export function MarkDoneButton({ task }: { task: Task }) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation();

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Mark done ${task.title}`}
      disabled={isLoading}
      onClick={() => void updateTask({ id: task.id, patch: { status: 'done' } })}
    >
      Mark done
    </Button>
  );
}
