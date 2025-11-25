// src/app/requests/page.tsx

import Link from 'next/link';
import type { ProcurementRequest } from '@/lib/types';
import { listProcurementRequests, ApiError } from '@/lib/api';
import { RequestsOverview } from '@/components/RequestsOverview';
import { Button } from '@/components/ui/button';

export default async function RequestsPage() {
  let requests: ProcurementRequest[] = [];
  let error: string | null = null;

  try {
    requests = await listProcurementRequests();
  } catch (err) {
    console.error('Failed to load procurement requests', err);
    error = err instanceof ApiError ? err.message : 'Unable to load requests. Please try again.';
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Procurement requests</h1>
          <p className="text-sm text-slate-600">
            Browse all requests, filter by status or department, and open details.
          </p>
        </div>
        <Button asChild>
          <Link href="/request/new">New request</Link>
        </Button>
      </header>

      <RequestsOverview requests={requests} error={error} />
    </div>
  );
}
