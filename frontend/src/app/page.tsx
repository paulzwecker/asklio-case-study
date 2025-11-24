// src/app/page.tsx

'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Procurement dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Start a new procurement request or review existing ones.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              New procurement request
              <Button asChild size="sm" variant="outline">
                <Link href="/request/new">Start</Link>
              </Button>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Fill out a form or upload an offer PDF to start a new purchasing
              request.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Request overview
              <Button asChild size="sm" variant="outline">
                <Link href="/requests">Open</Link>
              </Button>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              See all existing requests, their status, and drill into details.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
