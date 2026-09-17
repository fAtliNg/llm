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
import { useDeleteEmployeeMutation } from '@/features/employees/api';
import type { Employee } from '@/features/employees/model';

/** Destructive action behind a confirmation dialog, same as for tasks. */
export function DeleteEmployeeButton({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const [deleteEmployee, { isLoading }] = useDeleteEmployeeMutation();

  async function handleConfirm() {
    await deleteEmployee(employee.id).unwrap();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Delete ${employee.name}`}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete employee?</DialogTitle>
          <DialogDescription>
            “{employee.name}” will be removed permanently. This cannot be undone.
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
