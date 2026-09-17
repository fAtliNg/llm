import { useNavigate } from 'react-router';

import { useCreateBookingMutation } from '@/features/bookings/api';
import { BookingForm } from '@/features/bookings/booking-form';
import type { BookingInput } from '@/features/bookings/model';

export function BookingNewPage() {
  const navigate = useNavigate();
  const [createBooking] = useCreateBookingMutation();

  async function handleSubmit(values: BookingInput) {
    await createBooking(values).unwrap();
    await navigate('/bookings');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New booking</h1>
      <BookingForm onSubmit={handleSubmit} submitLabel="Book" />
    </section>
  );
}
