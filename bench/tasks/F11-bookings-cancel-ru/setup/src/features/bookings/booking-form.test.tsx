import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BookingForm } from '@/features/bookings/booking-form';
import { renderWithProviders } from '@/test/render';

describe('BookingForm', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<BookingForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid date')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an end hour that is not after the start hour', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <BookingForm onSubmit={onSubmit} defaultValues={{ title: 'Retro', date: '2026-11-02' }} />,
    );

    const end = screen.getByLabelText('End hour');
    await user.clear(end);
    await user.type(end, '9');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('End must be after start')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits hours as numbers', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<BookingForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Title'), 'Retro');
    await user.type(screen.getByLabelText('Date'), '2026-11-02');
    const end = screen.getByLabelText('End hour');
    await user.clear(end);
    await user.type(end, '12');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      title: 'Retro',
      room: 'atlas',
      date: '2026-11-02',
      startHour: 9,
      endHour: 12,
    });
  });
});
