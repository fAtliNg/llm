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
import { useCancelBookingMutation } from '@/features/bookings/api';
import type { Booking } from '@/features/bookings/model';

/** Cancelling cannot be undone, so it sits behind a confirmation like deleting a task. */
export function CancelBookingButton({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const [cancelBooking, { isLoading }] = useCancelBookingMutation();

  async function handleConfirm() {
    await cancelBooking(booking.id).unwrap();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Cancel ${booking.title}`}>
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel booking?</DialogTitle>
          <DialogDescription>
            “{booking.title}” will be cancelled and the room becomes free. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep</Button>
          </DialogClose>
          <Button variant="destructive" disabled={isLoading} onClick={() => void handleConfirm()}>
            Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
