// src/app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'askLio Procurement',
  description: 'Procurement request tool for the askLio case study.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <aside className="hidden w-56 flex-shrink-0 border-r border-slate-200 bg-white/80 px-4 py-6 sm:block">
            <div className="mb-8">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                askLio
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Procurement
              </div>
            </div>
            <nav className="space-y-1 text-sm">
              <Link
                href="/"
                className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/request/new"
                className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                New request
              </Link>
              <Link
                href="/requests"
                className="block rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                All requests
              </Link>
            </nav>
          </aside>
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
