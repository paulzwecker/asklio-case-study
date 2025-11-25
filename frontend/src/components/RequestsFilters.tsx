// src/components/RequestsFilters.tsx

'use client';

import { useEffect, useState } from 'react';
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
  onApply: (filters: {
    status?: RequestStatus;
    search?: string;
    department?: string;
  }) => void;
  onReset: () => void;
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
  onApply,
  onReset,
}: RequestsFiltersProps) {
  const [statusValue, setStatusValue] = useState<RequestStatus | 'all'>(status ?? 'all');
  const [searchValue, setSearchValue] = useState(search ?? '');
  const [departmentValue, setDepartmentValue] = useState(department ?? '');

  useEffect(() => {
    setStatusValue(status ?? 'all');
  }, [status]);

  useEffect(() => {
    setSearchValue(search ?? '');
  }, [search]);

  useEffect(() => {
    setDepartmentValue(department ?? '');
  }, [department]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onApply({
      status: statusValue === 'all' ? undefined : statusValue,
      search: searchValue.trim() || undefined,
      department: departmentValue.trim() || undefined,
    });
  };

  const handleReset = () => {
    setStatusValue('all');
    setSearchValue('');
    setDepartmentValue('');
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Select
          value={statusValue}
          onValueChange={(value) =>
            setStatusValue(value as RequestStatus | 'all')
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
        <Button type="submit" className=' cursor-pointer'>Apply</Button>
        <Button type="button" className=' cursor-pointer' variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
