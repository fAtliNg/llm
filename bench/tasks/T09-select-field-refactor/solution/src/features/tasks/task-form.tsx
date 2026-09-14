import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  taskInputSchema,
  type TaskInput,
} from '@/features/tasks/model';
import { SelectField } from '@/features/tasks/select-field';

interface TaskFormProps {
  defaultValues?: Partial<TaskInput>;
  onSubmit: (values: TaskInput) => Promise<void> | void;
  submitLabel?: string;
}

const emptyTask: TaskInput = { title: '', description: '', status: 'todo', priority: 'medium' };

const statusOptions = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));
const priorityOptions = TASK_PRIORITIES.map((value) => ({
  value,
  label: TASK_PRIORITY_LABELS[value],
}));

/**
 * Canonical form: react-hook-form owns the state, zod validates, shadcn Field renders.
 * Every input is wrapped in a Controller so Radix components (Select) integrate the same
 * way as native ones.
 */
export function TaskForm({ defaultValues, onSubmit, submitLabel = 'Save' }: TaskFormProps) {
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: { ...emptyTask, ...defaultValues },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void form.handleSubmit((values) => onSubmit(values))(event)}
      className="max-w-lg"
    >
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input {...field} id="task-title" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <Textarea {...field} id="task-description" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <SelectField
          control={form.control}
          name="status"
          id="task-status"
          label="Status"
          options={statusOptions}
          placeholder="Select a status"
        />

        <SelectField
          control={form.control}
          name="priority"
          id="task-priority"
          label="Priority"
          options={priorityOptions}
          placeholder="Select a priority"
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
