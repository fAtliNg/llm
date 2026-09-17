import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ContactForm } from '@/features/contacts/contact-form';
import { renderWithProviders } from '@/test/render';

describe('ContactForm', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<ContactForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the entered values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Sample value');
    await user.type(screen.getByLabelText('Email'), 'sample@example.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      name: 'Sample value',
      email: 'sample@example.com',
      phone: null,
      group: 'friends',
    });
  });
});
