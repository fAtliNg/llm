import { Link, useLocation } from 'react-router';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">No page at {pathname}</p>
      <Button asChild variant="outline">
        <Link to="/">Back to tasks</Link>
      </Button>
    </section>
  );
}
