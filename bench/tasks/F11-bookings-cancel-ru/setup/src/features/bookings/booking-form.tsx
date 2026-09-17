import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  bookingInputSchema,
  FIRST_HOUR,
  LAST_HOUR,
  ROOM_LABELS,
  ROOMS,
  type BookingInput,
} from '@/features/bookings/model';

interface BookingFormProps {
  defaultValues?: Partial<BookingInput>;
  onSubmit: (values: BookingInput) => Promise<void> | void;
  submitLabel?: string;
}

const emptyBooking: BookingInput = {
  title: '',
  room: 'atlas',
  date: '',
  startHour: 9,
  endHour: 10,
};

function conflictMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  if (error.status !== 409 || !('data' in error)) return undefined;
  const { data } = error;
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  return typeof data.message === 'string' ? data.message : undefined;
}

export function BookingForm({ defaultValues, onSubmit, submitLabel = 'Save' }: BookingFormProps) {
  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingInputSchema),
    defaultValues: { ...emptyBooking, ...defaultValues },
  });

  /** A 409 from the API means the room is taken: show the API message above the buttons. */
  async function handleValid(values: BookingInput) {
    try {
      await onSubmit(values);
    } catch (error) {
      const message = conflictMessage(error);
      if (!message) throw error;
      form.setError('root', { message });
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void form.handleSubmit(handleValid)(event)}
      className="max-w-lg"
    >
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="booking-title">Title</FieldLabel>
              <Input {...field} id="booking-title" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="room"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="booking-room">Room</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="booking-room" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.map((room) => (
                    <SelectItem key={room} value={room}>
                      {ROOM_LABELS[room]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="booking-date">Date</FieldLabel>
              <Input {...field} id="booking-date" type="date" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {(['startHour', 'endHour'] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`booking-${name}`}>
                  {name === 'startHour' ? 'Start hour' : 'End hour'}
                </FieldLabel>
                <Input
                  {...field}
                  id={`booking-${name}`}
                  type="number"
                  min={FIRST_HOUR}
                  max={LAST_HOUR}
                  value={Number.isNaN(field.value) ? '' : field.value}
                  onChange={(event) => {
                    field.onChange(event.target.valueAsNumber);
                  }}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        ))}

        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Field orientation="horizontal">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
