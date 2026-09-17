import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">{booking.title}</TableCell>
            <TableCell>{ROOM_LABELS[booking.room]}</TableCell>
            <TableCell>{booking.date}</TableCell>
            <TableCell>{formatHours(booking)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
