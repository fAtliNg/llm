import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDeleteTaskMutation } from '@/features/tasks/api';
import type { Task } from '@/features/tasks/model';

/** Destructive action behind a confirmation dialog. The mutation drives the pending state. */
export function DeleteTaskButton({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [deleteTask, { isLoading }] = useDeleteTaskMutation();

  async function handleConfirm() {
    await deleteTask(task.id).unwrap();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Delete ${task.title}`}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete task?</DialogTitle>
          <DialogDescription>
            “{task.title}” will be removed permanently. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={isLoading} onClick={() => void handleConfirm()}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
