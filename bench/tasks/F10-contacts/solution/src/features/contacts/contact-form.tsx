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
  CONTACT_GROUP_LABELS,
  CONTACT_GROUPS,
  contactInputSchema,
  type ContactInput,
} from '@/features/contacts/model';

interface ContactFormProps {
  defaultValues?: Partial<ContactInput>;
  onSubmit: (values: ContactInput) => Promise<void> | void;
  submitLabel?: string;
}

const emptyContact: ContactInput = {
  name: '',
  email: '',
  phone: null,
  group: 'friends',
};

export function ContactForm({ defaultValues, onSubmit, submitLabel = 'Save' }: ContactFormProps) {
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: { ...emptyContact, ...defaultValues },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void form.handleSubmit((values) => onSubmit(values))(event)}
      className="max-w-lg"
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-name">Name</FieldLabel>
              <Input {...field} id="contact-name" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              <Input {...field} id="contact-email" type="email" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
              <Input
                {...field}
                id="contact-phone"
                type="tel"
                placeholder="+123456789"
                value={field.value ?? ''}
                onChange={(event) => {
                  field.onChange(event.target.value || null);
                }}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="group"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-group">Group</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="contact-group" aria-invalid={fieldState.invalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_GROUPS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {CONTACT_GROUP_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field orientation="horizontal">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
