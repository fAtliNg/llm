import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CancelBookingButton } from '@/features/bookings/cancel-booking-button';
import { formatHours, ROOM_LABELS, type Booking } from '@/features/bookings/model';

export function BookingList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No bookings yet. Book a room.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">{booking.title}</TableCell>
            <TableCell>{ROOM_LABELS[booking.room]}</TableCell>
            <TableCell>{booking.date}</TableCell>
            <TableCell>{formatHours(booking)}</TableCell>
            <TableCell className="flex justify-end">
              {booking.cancelledAt ? (
                <Badge variant="outline">Cancelled</Badge>
              ) : (
                <CancelBookingButton booking={booking} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
