// src/app/requests/page.tsx

import Link from 'next/link';
import type { RequestStatus, ProcurementRequest } from '@/lib/types';
import { listProcurementRequests, ApiError } from '@/lib/api';
import { RequestsFilters } from '@/components/RequestsFilters';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatDate = (value: string) => dateFormatter.format(new Date(value));

const isValidStatus = (value?: string): value is RequestStatus =>
  value === 'Open' || value === 'In Progress' || value === 'Closed';

interface RequestsPageProps {
  searchParams?: {
    status?: string;
    search?: string;
    department?: string;
  };
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const statusFilter = isValidStatus(searchParams?.status)
    ? (searchParams?.status as RequestStatus)
    : undefined;
  const search = searchParams?.search?.trim() || undefined;
  const department = searchParams?.department?.trim() || undefined;

  let requests: ProcurementRequest[] = [];
  let error: string | null = null;

  try {
    requests = await listProcurementRequests({ status: statusFilter, department, search });
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

      <RequestsFilters
        key={`${statusFilter ?? 'all'}-${search ?? ''}-${department ?? ''}`}
        status={statusFilter}
        search={search}
        department={department}
      />

      {error ? (
        <ErrorState message={error} />
      ) : requests.length === 0 ? (
        <EmptyState />
      ) : (
        <RequestsTable requests={requests} />
      )}
    </div>
  );
}

function RequestsTable({ requests }: { requests: ProcurementRequest[] }) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Requests</CardTitle>
        <CardDescription>{requests.length} results</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} className="align-top">
                <TableCell className="font-mono text-xs text-slate-600">
                  {request.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-medium text-slate-900">{request.title}</TableCell>
                <TableCell className="text-slate-700">{request.vendor_name}</TableCell>
                <TableCell className="text-slate-700">{request.department}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(request.total_cost)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {formatDate(request.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/requests/${request.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-4 py-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">No requests yet</h2>
          <p className="text-sm text-slate-600">
            Start by creating a new procurement request.
          </p>
        </div>
        <Button asChild>
          <Link href="/request/new">Create a request</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex flex-col gap-3 py-6">
        <div>
          <h2 className="text-lg font-semibold text-red-800">Could not load requests</h2>
          <p className="text-sm text-red-700">{message}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/requests">Retry</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/request/new">Create new</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
