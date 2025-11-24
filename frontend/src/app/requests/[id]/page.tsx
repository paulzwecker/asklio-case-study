// src/app/requests/[id]/page.tsx

import Link from 'next/link';
import { RequestDetail } from '@/components/RequestDetail';
import { ApiError, getProcurementRequest } from '@/lib/api';
import type { ProcurementRequest } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RequestDetailPageProps {
  params: { id: string };
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = params;

  let request: ProcurementRequest | null = null;
  let fetchError: unknown = null;

  try {
    request = await getProcurementRequest(id);
  } catch (error) {
    fetchError = error;
    console.error('Failed to fetch request detail', error);
  }

  if (request) {
    return <RequestDetail request={request} />;
  }

  if (fetchError instanceof ApiError && fetchError.status === 404) {
    return <NotFoundState id={id} />;
  }

  const message =
    fetchError instanceof ApiError
      ? fetchError.message
      : 'Something went wrong while loading this request.';

  return <ErrorState message={message} id={id} />;
}

function NotFoundState({ id }: { id: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Request not found</CardTitle>
        <CardDescription>
          We could not find a procurement request with ID {id}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/requests">Back to all requests</Link>
        </Button>
        <Button asChild>
          <Link href="/request/new">Create a new request</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ErrorState({ message, id }: { message: string; id: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-base text-red-800">Could not load request</CardTitle>
        <CardDescription className="text-red-700">
          {message} (ID: {id})
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/requests/${id}`}>Retry</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/requests">Back to list</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
