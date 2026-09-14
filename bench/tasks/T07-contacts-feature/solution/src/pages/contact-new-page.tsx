import { useNavigate } from 'react-router';

import { useCreateContactMutation } from '@/features/contacts/api';
import { ContactForm } from '@/features/contacts/contact-form';
import type { ContactInput } from '@/features/contacts/model';

export function ContactNewPage() {
  const navigate = useNavigate();
  const [createContact] = useCreateContactMutation();

  async function handleSubmit(values: ContactInput) {
    await createContact(values).unwrap();
    await navigate('/contacts');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New contact</h1>
      <ContactForm onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
