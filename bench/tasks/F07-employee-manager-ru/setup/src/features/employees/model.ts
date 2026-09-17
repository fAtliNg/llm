import type { Department } from '@shared/employees';

/** The data contract lives in `shared/employees.ts`; this file adds what only the UI needs. */
export * from '@shared/employees';

export const DEPARTMENT_LABELS: Record<Department, string> = {
  engineering: 'Engineering',
  design: 'Design',
  sales: 'Sales',
};
