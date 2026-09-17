import type { GenEntity } from './entity-codegen.ts';

/**
 * Structured twins of the pool entities from pool-fs.ts. The code generator turns each of them into a
 * finished feature, which becomes the starting project of the second-wave tasks. None of them is a
 * benchmark entity.
 */
export const GEN_ENTITIES: GenEntity[] = [
  {
    singular: 'customer', plural: 'customers', columns: ['name', 'email', 'tier'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', max: 100 },
      { name: 'email', label: 'Email', kind: 'email', unique: true },
      { name: 'tier', label: 'Tier', kind: 'enum', options: [['free', 'Free'], ['pro', 'Pro'], ['enterprise', 'Enterprise']], default: 'free' },
    ],
    seeds: [
      { name: 'Ada Lovelace', email: 'ada@example.com', tier: 'pro' },
      { name: 'Alan Turing', email: 'alan@example.com', tier: 'free' },
    ],
  },
  {
    singular: 'product', plural: 'products', columns: ['name', 'price', 'inStock'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', max: 80 },
      { name: 'price', label: 'Price', kind: 'money' },
      { name: 'inStock', label: 'In stock', kind: 'bool', default: true },
    ],
    seeds: [
      { name: 'Desk lamp', price: 39.9, inStock: true },
      { name: 'Standing desk', price: 499, inStock: false },
      { name: 'Monitor arm', price: 89.5, inStock: true },
    ],
  },
  {
    singular: 'order', plural: 'orders', columns: ['customerName', 'total', 'status'],
    fields: [
      { name: 'customerName', label: 'Customer', kind: 'text', max: 100 },
      { name: 'total', label: 'Total', kind: 'money' },
      { name: 'status', label: 'Status', kind: 'enum', options: [['new', 'New'], ['paid', 'Paid'], ['shipped', 'Shipped']], default: 'new' },
    ],
    seeds: [
      { customerName: 'Ada Lovelace', total: 120.5, status: 'paid' },
      { customerName: 'Alan Turing', total: 75, status: 'new' },
    ],
  },
  {
    singular: 'note', plural: 'notes', columns: ['title', 'pinned'],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', max: 120 },
      { name: 'body', label: 'Body', kind: 'textarea', max: 2000 },
      { name: 'pinned', label: 'Pinned', kind: 'bool', default: false },
    ],
    seeds: [
      { title: 'Release checklist', body: 'Tag, build, announce', pinned: true },
      { title: 'Ideas', body: 'Dark mode, export to CSV', pinned: false },
    ],
  },
  {
    singular: 'tag', plural: 'tags', columns: ['name', 'color'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', min: 2, max: 30, unique: true },
      { name: 'color', label: 'Colour', kind: 'enum', options: [['red', 'Red'], ['green', 'Green'], ['blue', 'Blue']] },
    ],
    seeds: [
      { name: 'urgent', color: 'red' },
      { name: 'backend', color: 'green' },
      { name: 'design', color: 'blue' },
    ],
  },
  {
    singular: 'article', plural: 'articles', columns: ['title', 'publishedAt'],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', max: 150 },
      { name: 'summary', label: 'Summary', kind: 'textarea', max: 300, optional: true },
      { name: 'publishedAt', label: 'Published on', kind: 'date', optional: true },
    ],
    seeds: [
      { title: 'Why SQLite', summary: 'One file, zero servers', publishedAt: '2026-05-04' },
      { title: 'Migrations without fear', summary: '', publishedAt: null },
    ],
  },
  {
    singular: 'event', plural: 'events', columns: ['name', 'date', 'capacity'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', max: 100 },
      { name: 'date', label: 'Date', kind: 'date' },
      { name: 'capacity', label: 'Capacity', kind: 'int', min: 1, max: 1000 },
    ],
    seeds: [
      { name: 'Team offsite', date: '2026-11-12', capacity: 40 },
      { name: 'Hack day', date: '2026-12-01', capacity: 120 },
    ],
  },
  {
    singular: 'expense', plural: 'expenses', columns: ['description', 'amount', 'category', 'spentOn'],
    fields: [
      { name: 'description', label: 'Description', kind: 'text', max: 200 },
      { name: 'amount', label: 'Amount', kind: 'money' },
      { name: 'category', label: 'Category', kind: 'enum', options: [['travel', 'Travel'], ['food', 'Food'], ['office', 'Office']] },
      { name: 'spentOn', label: 'Date', kind: 'date' },
    ],
    seeds: [
      { description: 'Train to Berlin', amount: 89.9, category: 'travel', spentOn: '2026-09-01' },
      { description: 'Team lunch', amount: 142.3, category: 'food', spentOn: '2026-09-03' },
      { description: 'Whiteboard markers', amount: 12, category: 'office', spentOn: '2026-09-05' },
    ],
  },
  {
    singular: 'vehicle', plural: 'vehicles', columns: ['plate', 'model', 'mileage'],
    fields: [
      { name: 'plate', label: 'Plate', kind: 'text', min: 4, max: 10, unique: true },
      { name: 'model', label: 'Model', kind: 'text', max: 100 },
      { name: 'mileage', label: 'Mileage', kind: 'int', min: 0, max: 2000000 },
    ],
    seeds: [
      { plate: 'AB-1234', model: 'Transit', mileage: 84200 },
      { plate: 'CD-5678', model: 'Kangoo', mileage: 15300 },
    ],
  },
  {
    singular: 'room', plural: 'rooms', columns: ['name', 'floor', 'hasProjector'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', max: 100 },
      { name: 'floor', label: 'Floor', kind: 'int', min: 0, max: 50 },
      { name: 'hasProjector', label: 'Projector', kind: 'bool', default: false },
    ],
    seeds: [
      { name: 'Aquarium', floor: 2, hasProjector: true },
      { name: 'Library', floor: 5, hasProjector: false },
    ],
  },
  {
    singular: 'recipe', plural: 'recipes', columns: ['title', 'minutes', 'difficulty'],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', max: 100 },
      { name: 'minutes', label: 'Minutes', kind: 'int', min: 1, max: 600 },
      { name: 'difficulty', label: 'Difficulty', kind: 'enum', options: [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']] },
      { name: 'instructions', label: 'Instructions', kind: 'textarea', max: 5000 },
    ],
    seeds: [
      { title: 'Shakshuka', minutes: 25, difficulty: 'easy', instructions: 'Simmer the sauce, crack the eggs, cover.' },
      { title: 'Croissants', minutes: 480, difficulty: 'hard', instructions: 'Laminate, rest, shape, proof, bake.' },
    ],
  },
  {
    singular: 'ticket', plural: 'tickets', columns: ['subject', 'severity', 'resolved'],
    fields: [
      { name: 'subject', label: 'Subject', kind: 'text', max: 140 },
      { name: 'severity', label: 'Severity', kind: 'enum', options: [['low', 'Low'], ['normal', 'Normal'], ['critical', 'Critical']], default: 'normal' },
      { name: 'resolved', label: 'Resolved', kind: 'bool', default: false },
    ],
    seeds: [
      { subject: 'Login page is slow', severity: 'normal', resolved: false },
      { subject: 'Export fails on large files', severity: 'critical', resolved: false },
      { subject: 'Typo in the footer', severity: 'low', resolved: true },
    ],
  },
];
