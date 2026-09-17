import type { ContactGroup } from '@shared/contacts';

/** The data contract lives in `shared/contacts.ts`; this file adds what only the UI needs. */
export * from '@shared/contacts';

export const CONTACT_GROUP_LABELS: Record<ContactGroup, string> = {
  family: 'Family',
  friends: 'Friends',
  work: 'Work',
};
