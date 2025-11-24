// src/app/requests/page.tsx

'use client';

// Später holt diese Seite Daten via listProcurementRequests() aus dem Backend
// und rendert eine Tabelle mit shadcn/ui-table.

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">All requests</h1>
          <p className="text-sm text-slate-600">
            Overview of all procurement requests (to be wired to the backend).
          </p>
        </div>
        <Button asChild>
          <Link href="/request/new">New request</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests</CardTitle>
          <CardDescription>
            Table of requests will be implemented here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          TODO for coding agent:
          <ul className="mt-2 list-disc pl-5">
            <li>Call <code>GET /requests</code> via <code>listProcurementRequests()</code>.</li>
            <li>Render a shadcn <code>Table</code> with ID, title, vendor, department, total, status.</li>
            <li>Add basic filtering by status/department.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
