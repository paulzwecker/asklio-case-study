// src/app/requests/[id]/page.tsx

'use client';

// Später: getProcurementRequest(id) nutzen, um Details vom Backend zu holen,
// Status-Badge + Status-Update-Controls über shadcn components.

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface RequestDetailPageProps {
  params: { id: string };
}

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = params;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Request detail
        </h1>
        <p className="text-sm text-slate-600">
          This page will show all fields and line items for request <code>{id}</code>.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request #{id}</CardTitle>
          <CardDescription>
            Detailed view not implemented yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          TODO for coding agent:
          <ul className="mt-2 list-disc pl-5">
            <li>Fetch request by ID from backend.</li>
            <li>Render general info (title, vendor, department, total cost).</li>
            <li>Render line items using <code>Table</code>.</li>
            <li>Render status (with a shadcn <code>Badge</code>) &amp; controls to change it.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
