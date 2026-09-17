import { useState } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetContactsQuery } from '@/features/contacts/api';
import { ContactList } from '@/features/contacts/contact-list';

export function ContactsPage() {
  const [search, setSearch] = useState('');
  const q = search.trim();
  const { data: contacts, isLoading, isError, refetch } = useGetContactsQuery(q);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <Button asChild>
          <Link to="/contacts/new">New contact</Link>
        </Button>
      </div>

      <Field className="max-w-xs">
        <FieldLabel htmlFor="contacts-search">Search</FieldLabel>
        <Input
          id="contacts-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
      </Field>

      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading contacts">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load contacts</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {contacts && q !== '' && contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matches</p>
      ) : (
        contacts && <ContactList contacts={contacts} />
      )}
    </section>
  );
}
