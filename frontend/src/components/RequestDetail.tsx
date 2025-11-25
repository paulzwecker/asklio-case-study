// src/components/RequestDetail.tsx

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ProcurementRequest } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { RequestStatusControl } from '@/components/RequestStatusControl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RequestDetailProps {
  request: ProcurementRequest;
}

export function RequestDetail({ request }: RequestDetailProps) {
  const [currentRequest, setCurrentRequest] = useState<ProcurementRequest>(request);

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

  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const formatDate = (value: string) => dateFormatter.format(new Date(value));

  const { order_lines: orderLines } = currentRequest;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <Link href="/requests" className="text-sm text-slate-600 hover:text-slate-800">
            &larr; Back to requests
          </Link>
          <h1 className="mt-5 text-2xl font-semibold text-slate-900">{currentRequest.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <StatusBadge status={currentRequest.status} />
            <span className="font-mono text-xs">ID {currentRequest.id}</span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-sm text-slate-600">Total cost</p>
          <p className="text-xl font-semibold text-slate-900">
            {formatCurrency(currentRequest.total_cost)}
          </p>
          <p className="text-xs text-slate-500">
            Updated {formatDate(currentRequest.updated_at)}
          </p>
        </div>
      </header>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex w-full justify-between">
            <div>
          <CardTitle className="text-base">Request metadata</CardTitle>
          <CardDescription>Core information about this procurement.</CardDescription></div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Status</p>
              <RequestStatusControl
                requestId={currentRequest.id}
                status={currentRequest.status}
                onUpdated={setCurrentRequest}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <MetadataItem label="Requestor" value={currentRequest.requestor_name} />
          <MetadataItem label="Department" value={currentRequest.department} />
          <MetadataItem label="Vendor" value={currentRequest.vendor_name} />
          <MetadataItem label="Vendor VAT ID" value={currentRequest.vendor_vat_id || 'N/A'} />
          <MetadataItem
            label="Commodity group"
            value={currentRequest.commodity_group || 'Pending classification'}
          />
          <MetadataItem label="Created" value={formatDate(currentRequest.created_at)} />
          <MetadataItem label="Last updated" value={formatDate(currentRequest.updated_at)} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Order lines</CardTitle>
          <CardDescription>All line items provided for this request.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {orderLines.length === 0 ? (
            <p className="text-sm text-slate-600">No order lines available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLines.map((line, idx) => (
                  <TableRow key={line.id ?? idx}>
                    <TableCell className="text-slate-900">{line.position_description}</TableCell>
                    <TableCell className="text-right text-slate-700">
                      {formatCurrency(line.unit_price)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700">{line.amount}</TableCell>
                    <TableCell className="text-slate-700">{line.unit}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.total_price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>Quick totals and current status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Badge variant="secondary" className="text-sm">
            {orderLines.length} line items
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Total {formatCurrency(currentRequest.total_cost)}
          </Badge>
          <StatusBadge status={currentRequest.status} />
        </CardContent>
      </Card>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
