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
import { Textarea } from '@/components/ui/textarea';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  taskInputSchema,
  type TaskInput,
} from '@/features/tasks/model';
import type { Project } from '@shared/projects';

/** Radix Select has no empty value, so "no project" needs a sentinel. */
const NO_PROJECT = 'none';

interface TaskFormProps {
  /** Projects the task can belong to. */
  projects?: Pick<Project, 'id' | 'name'>[];
  defaultValues?: Partial<TaskInput>;
  onSubmit: (values: TaskInput) => Promise<void> | void;
  submitLabel?: string;
}

const emptyTask: TaskInput = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  projectId: null,
};

/**
 * Canonical form: react-hook-form owns the state, zod validates, shadcn Field renders.
 * Every input is wrapped in a Controller so Radix components (Select) integrate the same
 * way as native ones.
 */
export function TaskForm({
  projects = [],
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: TaskFormProps) {
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

        <Controller
          name="status"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="task-status">Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-status" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="priority"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-priority" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select a priority" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {TASK_PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="projectId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="task-project">Project</FieldLabel>
              <Select
                value={field.value ?? NO_PROJECT}
                onValueChange={(value) => {
                  field.onChange(value === NO_PROJECT ? null : value);
                }}
              >
                <SelectTrigger id="task-project" aria-invalid={fieldState.invalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT}>No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
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
