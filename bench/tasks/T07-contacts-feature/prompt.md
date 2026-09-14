Add a Contacts section to the app. Users need:

- a list of contacts (name and email) at `/contacts`, reachable through a "Contacts" link in the main navigation;
- a way to add a contact at `/contacts/new`: a form with a "Name" field (required) and an "Email" field (required, must be a valid email) and a "Create" button; after creating, return to the contacts list where the new contact appears.

Follow the same layering as the tasks feature, including the mock API at `/api/contacts` backed by the in-memory db.
