import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUpdateContactMutation } from '@/features/contacts/api';
import { CONTACT_GROUP_LABELS, type Contact } from '@/features/contacts/model';

function FavoriteButton({ contact }: { contact: Contact }) {
  const [updateContact, { isLoading }] = useUpdateContactMutation();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isLoading}
      aria-pressed={contact.favorite}
      aria-label={
        contact.favorite
          ? `Remove ${contact.name} from favourites`
          : `Add ${contact.name} to favourites`
      }
      onClick={() => void updateContact({ id: contact.id, patch: { favorite: !contact.favorite } })}
    >
      {contact.favorite ? '★' : '☆'}
    </Button>
  );
}

export function ContactList({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return <p className="text-sm text-muted-foreground">No contacts yet. Add the first one.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Group</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Favourite</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">{contact.name}</TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>{contact.phone ?? '—'}</TableCell>
            <TableCell>{CONTACT_GROUP_LABELS[contact.group]}</TableCell>
            <TableCell>
              <FavoriteButton contact={contact} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
