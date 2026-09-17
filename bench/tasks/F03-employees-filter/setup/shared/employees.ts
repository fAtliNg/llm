import { z } from 'zod';

/** Contract for employees, shared by the API and the web app. */
export const DEPARTMENTS = ['engineering', 'design', 'sales'] as const;

export const departmentSchema = z.enum(DEPARTMENTS);

export type Department = z.infer<typeof departmentSchema>;

/** What the user fills in. Shared by the form and the API payloads. */
export const employeeInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Keep the name under 100 characters'),
  email: z.email('Enter a valid email'),
  department: departmentSchema,
  /** ISO date `YYYY-MM-DD`, or null when the start date is unknown. */
  startDate: z.iso.date('Enter a valid date').nullable(),
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;

/** What the API returns. */
export const employeeSchema = employeeInputSchema.extend({
  id: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;
