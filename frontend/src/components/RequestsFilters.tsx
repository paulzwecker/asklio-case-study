// src/components/RequestsFilters.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RequestStatus } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RequestsFiltersProps {
  status?: RequestStatus;
  search?: string;
  department?: string;
}

const statusOptions: { label: string; value: RequestStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'Open' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Closed', value: 'Closed' },
];

export function RequestsFilters({
  status,
  search,
  department,
}: RequestsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search ?? '');
  const [departmentValue, setDepartmentValue] = useState(department ?? '');
  const [isPending, startTransition] = useTransition();

  const updateQuery = (updates: {
    status?: RequestStatus;
    search?: string;
    department?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.status) {
      params.set('status', updates.status);
    } else {
      params.delete('status');
    }

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search);
      } else {
        params.delete('search');
      }
    }

    if (updates.department !== undefined) {
      if (updates.department) {
        params.set('department', updates.department);
      } else {
        params.delete('department');
      }
    }

    const query = params.toString();
    const url = query ? `?${query}` : '.';

    startTransition(() => {
      router.push(url, { scroll: false });
    });
  };

  const handleStatusChange = (value: RequestStatus | 'all') => {
    updateQuery({ status: value === 'all' ? undefined : value });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateQuery({ search: searchValue.trim(), department: departmentValue.trim() });
  };

  const handleReset = () => {
    setSearchValue('');
    setDepartmentValue('');
    updateQuery({ status: undefined, search: undefined, department: undefined });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Select
          value={status ?? 'all'}
          onValueChange={(value) =>
            handleStatusChange(value as RequestStatus | 'all')
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-full sm:w-[220px]"
          placeholder="Search by title or vendor"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />

        <Input
          className="w-full sm:w-[180px]"
          placeholder="Department"
          value={departmentValue}
          onChange={(e) => setDepartmentValue(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Apply'}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={isPending}>
          Reset
        </Button>
      </div>
    </form>
  );
}
