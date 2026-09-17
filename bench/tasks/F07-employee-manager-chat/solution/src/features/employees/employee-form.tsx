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
  type Employee,
  type EmployeeInput,
} from '@/features/employees/model';

/** Radix Select has no empty value, so "no manager" needs a sentinel. */
const NO_MANAGER = 'none';

interface EmployeeFormProps {
  /** Employees that can be picked as the manager. */
  managers?: Employee[];
  defaultValues?: Partial<EmployeeInput>;
  onSubmit: (values: EmployeeInput) => Promise<void> | void;
  submitLabel?: string;
}

const emptyEmployee: EmployeeInput = {
  name: '',
  email: '',
  department: 'engineering',
  startDate: null,
  managerId: null,
};

export function EmployeeForm({
  managers = [],
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: EmployeeFormProps) {
  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeInputSchema),
    defaultValues: { ...emptyEmployee, ...defaultValues },
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

        <Controller
          name="managerId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="employee-manager">Manager</FieldLabel>
              <Select
                value={field.value ?? NO_MANAGER}
                onValueChange={(value) => {
                  field.onChange(value === NO_MANAGER ? null : value);
                }}
              >
                <SelectTrigger id="employee-manager" aria-invalid={fieldState.invalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_MANAGER}>No manager</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
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
