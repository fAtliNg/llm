import { baseApi } from '@/api/base-api';
import type { Booking, BookingInput } from '@/features/bookings/model';

/** Booking endpoints injected into the shared API. Same cache strategy as tasks. */
export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBookings: build.query<Booking[], void>({
      query: () => 'bookings',
      providesTags: (result = []) => [
        { type: 'Booking', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Booking' as const, id })),
      ],
    }),

    createBooking: build.mutation<Booking, BookingInput>({
      query: (body) => ({ url: 'bookings', method: 'POST', body }),
      invalidatesTags: [{ type: 'Booking', id: 'LIST' }],
    }),

    cancelBooking: build.mutation<Booking, string>({
      query: (id) => ({ url: `bookings/${id}/cancel`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Booking', id }],
    }),
  }),
});

export const { useGetBookingsQuery, useCreateBookingMutation, useCancelBookingMutation } =
  bookingsApi;
