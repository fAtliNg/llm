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
  DEPARTMENT_LABELS,
  DEPARTMENTS,
  employeeInputSchema,
  type EmployeeInput,
} from '@/features/employees/model';

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeInput>;
  onSubmit: (values: EmployeeInput) => Promise<void> | void;
  submitLabel?: string;
}

function conflictMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  if (error.status !== 409 || !('data' in error)) return undefined;
  const { data } = error;
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  return typeof data.message === 'string' ? data.message : undefined;
}

const emptyEmployee: EmployeeInput = {
  name: '',
  email: '',
  department: 'engineering',
  startDate: null,
};

export function EmployeeForm({ defaultValues, onSubmit, submitLabel = 'Save' }: EmployeeFormProps) {
  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeInputSchema),
    defaultValues: { ...emptyEmployee, ...defaultValues },
  });

  /** A 409 from the API means the email is taken: show the API message under the field. */
  async function handleValid(values: EmployeeInput) {
    try {
      await onSubmit(values);
    } catch (error) {
      const message = conflictMessage(error);
      if (!message) throw error;
      form.setError('email', { message });
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
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="employee-name">Name</FieldLabel>
              <Input {...field} id="employee-name" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="employee-email">Email</FieldLabel>
              <Input
                {...field}
                id="employee-email"
                type="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="department"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="employee-department">Department</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="employee-department" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>
                      {DEPARTMENT_LABELS[department]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="startDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="employee-start-date">Start date</FieldLabel>
              <Input
                {...field}
                id="employee-start-date"
                type="date"
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

        <Field orientation="horizontal">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
