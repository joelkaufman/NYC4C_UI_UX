import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Request not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have been removed when the demo data was reset.</p>
      <Button asChild className="mt-6">
        <Link to="/">Go to my requests</Link>
      </Button>
    </div>
  );
}
