'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ProcurementRequest, RequestStatus } from '@/lib/types';
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

type SortColumn =
  | 'id'
  | 'title'
  | 'vendor_name'
  | 'department'
  | 'total_cost'
  | 'created_at'
  | 'status';

interface RequestsOverviewProps {
  requests: ProcurementRequest[];
  error?: string | null;
}

const sortLabel = (active: boolean, direction: 'asc' | 'desc') =>
  active ? (direction === 'asc' ? '^' : 'v') : '<>';

export function RequestsOverview({ requests, error }: RequestsOverviewProps) {
  const [filters, setFilters] = useState<{
    status?: RequestStatus;
    search?: string;
    department?: string;
  }>({});
  const [sort, setSort] = useState<{ column: SortColumn; direction: 'asc' | 'desc' }>({
    column: 'created_at',
    direction: 'desc',
  });

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }),
    []
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    []
  );

  const toggleSort = (column: SortColumn) => {
    setSort((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Default to ascending except for created_at where descending is more useful
      const defaultDirection = column === 'created_at' ? 'desc' : 'asc';
      return { column, direction: defaultDirection };
    });
  };

  const filteredRequests = useMemo(() => {
    const searchTerm = filters.search?.toLowerCase() ?? '';
    const departmentTerm = filters.department?.toLowerCase() ?? '';

    return requests.filter((req) => {
      const matchesStatus = !filters.status || req.status === filters.status;
      const matchesDepartment =
        !departmentTerm || req.department.toLowerCase().includes(departmentTerm);
      const matchesSearch =
        !searchTerm ||
        [req.title, req.vendor_name].some((value) => value.toLowerCase().includes(searchTerm));
      return matchesStatus && matchesDepartment && matchesSearch;
    });
  }, [requests, filters]);

  const sortedRequests = useMemo(() => {
    const sorted = [...filteredRequests];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sort.column) {
        case 'total_cost':
          comparison = a.total_cost - b.total_cost;
          break;
        case 'created_at':
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'id':
        case 'title':
        case 'vendor_name':
        case 'department':
        case 'status':
          comparison = a[sort.column].toString().localeCompare(b[sort.column].toString(), undefined, {
            sensitivity: 'base',
          });
          break;
        default:
          comparison = 0;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredRequests, sort]);

  const handleApplyFilters = (next: {
    status?: RequestStatus;
    search?: string;
    department?: string;
  }) => {
    setFilters(next);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  if (error) {
    return (
      <div className="space-y-4">
        <RequestsFilters
          status={filters.status}
          search={filters.search}
          department={filters.department}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RequestsFilters
        status={filters.status}
        search={filters.search}
        department={filters.department}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {sortedRequests.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Requests</CardTitle>
            <CardDescription>{sortedRequests.length} results</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    <SortableHeader
                      label="ID"
                      column="id"
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Title"
                      column="title"
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Vendor"
                      column="vendor_name"
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Department"
                      column="department"
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader
                      label="Total"
                      column="total_cost"
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onToggle={toggleSort}
                      alignRight
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Status"
                      column="status"
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Created"
                      column="created_at"
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.map((request) => (
                  <TableRow key={request.id} className="align-top">
                    <TableCell className="font-mono text-xs text-slate-600">
                      {request.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{request.title}</TableCell>
                    <TableCell className="text-slate-700">{request.vendor_name}</TableCell>
                    <TableCell className="text-slate-700">{request.department}</TableCell>
                    <TableCell className="text-right font-medium">
                      {currencyFormatter.format(request.total_cost)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {dateFormatter.format(new Date(request.created_at))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/requests/${request.id}`}>Show</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  column,
  activeColumn,
  direction,
  onToggle,
  alignRight,
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn;
  direction: 'asc' | 'desc';
  onToggle: (column: SortColumn) => void;
  alignRight?: boolean;
}) {
  const isActive = column === activeColumn;
  return (
    <button
      type="button"
      onClick={() => onToggle(column)}
      className={`flex w-full items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:text-slate-900 ${
        alignRight ? 'justify-end' : ''
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] text-slate-400">{sortLabel(isActive, direction)}</span>
    </button>
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
