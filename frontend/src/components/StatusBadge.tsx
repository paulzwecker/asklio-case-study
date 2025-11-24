// src/components/StatusBadge.tsx

import type { RequestStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: RequestStatus;
}

const statusStyles: Record<RequestStatus, string> = {
  Open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('capitalize', statusStyles[status])}>
      {status}
    </Badge>
  );
}
