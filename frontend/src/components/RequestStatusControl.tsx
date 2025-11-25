// src/components/RequestStatusControl.tsx

'use client';

import React, { useState } from 'react';
import type { ProcurementRequest, RequestStatus } from '@/lib/types';
import { ApiError, updateRequestStatus } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequestStatusControlProps {
  requestId: string;
  status: RequestStatus;
  onUpdated?: (request: ProcurementRequest) => void;
}

const statusOptions: RequestStatus[] = ['Open', 'In Progress', 'Closed'];

export function RequestStatusControl({
  requestId,
  status,
  onUpdated,
}: RequestStatusControlProps) {
  const [currentStatus, setCurrentStatus] = useState<RequestStatus>(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (next: RequestStatus) => {
    if (next === currentStatus) return;

    const previous = currentStatus;
    setCurrentStatus(next);
    setIsUpdating(true);
    setError(null);

    try {
      const updated = await updateRequestStatus(requestId, next);
      setCurrentStatus(updated.status);
      onUpdated?.(updated);
    } catch (err) {
      console.error('Failed to update status', err);
      const message =
        err instanceof ApiError ? err.message : 'Could not update status. Please retry.';
      setCurrentStatus(previous);
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 cursor-pointer">
        <Select
          value={currentStatus}
          onValueChange={(value) => handleUpdate(value as RequestStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Set status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* <Badge variant="outline">{currentStatus}</Badge> */}
      </div>
      {isUpdating && <p className="text-xs text-slate-500">Updating status...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
