import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { projectInputSchema, type ProjectInput } from '@/features/projects/model';

interface ProjectFormProps {
  defaultValues?: Partial<ProjectInput>;
  onSubmit: (values: ProjectInput) => Promise<void> | void;
  submitLabel?: string;
}

const emptyProject: ProjectInput = {
  name: '',
  description: '',
};

export function ProjectForm({ defaultValues, onSubmit, submitLabel = 'Save' }: ProjectFormProps) {
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: { ...emptyProject, ...defaultValues },
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
              <FieldLabel htmlFor="project-name">Name</FieldLabel>
              <Input {...field} id="project-name" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <Textarea {...field} id="project-description" aria-invalid={fieldState.invalid} />
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
