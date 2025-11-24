// src/app/request/new/page.tsx

'use client';

import { RequestForm } from '@/components/RequestForm';

export default function NewRequestPage() {
  return (
    <div className="space-y-6">
      <RequestForm />
    </div>
  );
}
