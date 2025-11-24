// src/app/requests/[id]/loading.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[...Array(6)].map((_, idx) => (
            <Skeleton key={idx} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(4)].map((_, idx) => (
            <Skeleton key={idx} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
