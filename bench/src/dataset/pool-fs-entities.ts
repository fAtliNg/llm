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
  // ---------- entities whose "create end to end" tasks are generated from the structure (pool-fs-wave-b.ts)
  {
    singular: 'supplier', plural: 'suppliers', ru: 'поставщики', columns: ['name', 'email', 'country'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', max: 100 },
      { name: 'email', label: 'Email', kind: 'email', unique: true },
      { name: 'country', label: 'Country', kind: 'enum', options: [['de', 'Germany'], ['fr', 'France'], ['pl', 'Poland']] },
    ],
    seeds: [
      { name: 'Nordwind', email: 'sales@nordwind.example', country: 'de' },
      { name: 'Lumiere', email: 'hello@lumiere.example', country: 'fr' },
    ],
  },
  {
    singular: 'course', plural: 'courses', ru: 'курсы', columns: ['title', 'level', 'hours', 'published'],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', max: 120 },
      { name: 'level', label: 'Level', kind: 'enum', options: [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']], default: 'beginner' },
      { name: 'hours', label: 'Hours', kind: 'int', min: 1, max: 500 },
      { name: 'published', label: 'Published', kind: 'bool', default: false },
    ],
    seeds: [
      { title: 'SQL basics', level: 'beginner', hours: 12, published: true },
      { title: 'Type-level TypeScript', level: 'advanced', hours: 30, published: false },
    ],
  },
  {
    singular: 'book', plural: 'books', ru: 'книги', columns: ['title', 'author', 'year', 'genre'],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', max: 150 },
      { name: 'author', label: 'Author', kind: 'text', max: 100 },
      { name: 'year', label: 'Year', kind: 'int', min: 1450, max: 2100 },
      { name: 'genre', label: 'Genre', kind: 'enum', options: [['fiction', 'Fiction'], ['science', 'Science'], ['history', 'History']] },
    ],
    seeds: [
      { title: 'The Pragmatic Programmer', author: 'Hunt and Thomas', year: 1999, genre: 'science' },
      { title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'fiction' },
      { title: 'SPQR', author: 'Mary Beard', year: 2015, genre: 'history' },
    ],
  },
  {
    singular: 'movie', plural: 'movies', ru: 'фильмы', columns: ['title', 'year', 'rating', 'watched'],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', max: 150 },
      { name: 'year', label: 'Year', kind: 'int', min: 1888, max: 2100 },
      { name: 'rating', label: 'Rating', kind: 'int', min: 1, max: 10 },
      { name: 'watched', label: 'Watched', kind: 'bool', default: false },
    ],
    seeds: [
      { title: 'Stalker', year: 1979, rating: 9, watched: true },
      { title: 'Arrival', year: 2016, rating: 8, watched: false },
    ],
  },
  {
    singular: 'device', plural: 'devices', ru: 'устройства', columns: ['serial', 'model', 'status', 'purchasedOn'],
    fields: [
      { name: 'serial', label: 'Serial', kind: 'text', min: 5, max: 20, unique: true },
      { name: 'model', label: 'Model', kind: 'text', max: 80 },
      { name: 'status', label: 'Status', kind: 'enum', options: [['active', 'Active'], ['repair', 'In repair'], ['retired', 'Retired']], default: 'active' },
      { name: 'purchasedOn', label: 'Purchased on', kind: 'date' },
    ],
    seeds: [
      { serial: 'SN-10442', model: 'ThinkPad T14', status: 'active', purchasedOn: '2025-02-10' },
      { serial: 'SN-20871', model: 'MacBook Air', status: 'repair', purchasedOn: '2024-06-01' },
    ],
  },
  {
    singular: 'subscription', plural: 'subscriptions', ru: 'подписки', columns: ['service', 'price', 'period', 'renewsOn'],
    fields: [
      { name: 'service', label: 'Service', kind: 'text', max: 80 },
      { name: 'price', label: 'Price', kind: 'money' },
      { name: 'period', label: 'Period', kind: 'enum', options: [['monthly', 'Monthly'], ['yearly', 'Yearly']], default: 'monthly' },
      { name: 'renewsOn', label: 'Renews on', kind: 'date' },
      { name: 'active', label: 'Active', kind: 'bool', default: true },
    ],
    seeds: [
      { service: 'Cloud storage', price: 9.99, period: 'monthly', renewsOn: '2026-10-01', active: true },
      { service: 'Domain name', price: 14.5, period: 'yearly', renewsOn: '2027-03-15', active: true },
    ],
  },
  {
    singular: 'meeting', plural: 'meetings', ru: 'встречи', columns: ['topic', 'date', 'durationMinutes', 'online'],
    fields: [
      { name: 'topic', label: 'Topic', kind: 'text', max: 120 },
      { name: 'date', label: 'Date', kind: 'date' },
      { name: 'durationMinutes', label: 'Duration (minutes)', kind: 'int', min: 5, max: 480 },
      { name: 'online', label: 'Online', kind: 'bool', default: true },
    ],
    seeds: [
      { topic: 'Quarterly review', date: '2026-10-02', durationMinutes: 90, online: false },
      { topic: 'Design sync', date: '2026-10-03', durationMinutes: 30, online: true },
    ],
  },
  {
    singular: 'review', plural: 'reviews', ru: 'отзывы', columns: ['author', 'rating', 'approved'],
    fields: [
      { name: 'author', label: 'Author', kind: 'text', max: 80 },
      { name: 'rating', label: 'Rating', kind: 'int', min: 1, max: 5 },
      { name: 'comment', label: 'Comment', kind: 'textarea', max: 1000 },
      { name: 'approved', label: 'Approved', kind: 'bool', default: false },
    ],
    seeds: [
      { author: 'Marta', rating: 5, comment: 'Fast delivery, great support.', approved: true },
      { author: 'Oleg', rating: 2, comment: 'The box arrived damaged.', approved: false },
    ],
  },
  {
    singular: 'shipment', plural: 'shipments', ru: 'отправления', columns: ['trackingCode', 'carrier', 'weight', 'deliveredOn'],
    fields: [
      { name: 'trackingCode', label: 'Tracking code', kind: 'text', min: 6, max: 30, unique: true },
      { name: 'carrier', label: 'Carrier', kind: 'enum', options: [['dhl', 'DHL'], ['ups', 'UPS'], ['post', 'Post']] },
      { name: 'weight', label: 'Weight (kg)', kind: 'money' },
      { name: 'deliveredOn', label: 'Delivered on', kind: 'date', optional: true },
    ],
    seeds: [
      { trackingCode: 'TRK-000451', carrier: 'dhl', weight: 2.4, deliveredOn: '2026-09-10' },
      { trackingCode: 'TRK-000452', carrier: 'post', weight: 0.35, deliveredOn: null },
    ],
  },
  {
    singular: 'coupon', plural: 'coupons', ru: 'купоны', columns: ['code', 'discountPercent', 'expiresOn', 'active'],
    fields: [
      { name: 'code', label: 'Code', kind: 'text', min: 4, max: 20, unique: true },
      { name: 'discountPercent', label: 'Discount (%)', kind: 'int', min: 1, max: 100 },
      { name: 'expiresOn', label: 'Expires on', kind: 'date', optional: true },
      { name: 'active', label: 'Active', kind: 'bool', default: true },
    ],
    seeds: [
      { code: 'WELCOME10', discountPercent: 10, expiresOn: null, active: true },
      { code: 'AUTUMN25', discountPercent: 25, expiresOn: '2026-11-30', active: false },
    ],
  },
  {
    singular: 'workout', plural: 'workouts', ru: 'тренировки', columns: ['name', 'kind', 'minutes', 'date'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', max: 80 },
      { name: 'kind', label: 'Kind', kind: 'enum', options: [['run', 'Run'], ['ride', 'Ride'], ['swim', 'Swim']] },
      { name: 'minutes', label: 'Minutes', kind: 'int', min: 1, max: 600 },
      { name: 'date', label: 'Date', kind: 'date' },
    ],
    seeds: [
      { name: 'Morning loop', kind: 'run', minutes: 42, date: '2026-09-12' },
      { name: 'Hill repeats', kind: 'ride', minutes: 95, date: '2026-09-14' },
    ],
  },
  {
    singular: 'plant', plural: 'plants', ru: 'растения', columns: ['name', 'species', 'wateringDays', 'indoor'],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', max: 60 },
      { name: 'species', label: 'Species', kind: 'text', max: 100 },
      { name: 'wateringDays', label: 'Water every (days)', kind: 'int', min: 1, max: 60 },
      { name: 'indoor', label: 'Indoor', kind: 'bool', default: true },
    ],
    seeds: [
      { name: 'Big fern', species: 'Nephrolepis exaltata', wateringDays: 3, indoor: true },
      { name: 'Balcony rosemary', species: 'Salvia rosmarinus', wateringDays: 7, indoor: false },
    ],
  },
];
