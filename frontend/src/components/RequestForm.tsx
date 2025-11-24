// src/components/RequestForm.tsx

'use client';

import React, { useMemo, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderLine, OfferExtractionResult } from '@/lib/types';
import { COMMODITY_GROUPS } from '@/lib/types';
import {
  createProcurementRequest,
  parseOffer,
  ApiError,
  type CreateProcurementRequestPayload,
} from '@/lib/api';
import { RequestLinesTable } from '@/components/RequestLinesTable';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ParseState = 'idle' | 'loading' | 'success' | 'error';

const createEmptyLine = (seed: number): OrderLine => ({
  id: seed,
  position_description: '',
  unit_price: 0,
  amount: 0,
  unit: '',
  total_price: 0,
});

export const RequestForm: React.FC = () => {
  const router = useRouter();

  const [requestorName, setRequestorName] = useState('');
  const [title, setTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorVatId, setVendorVatId] = useState('');
  const [department, setDepartment] = useState('');
  const [commodityGroup, setCommodityGroup] = useState<string>('');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([createEmptyLine(0)]);
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [parseState, setParseState] = useState<ParseState>('idle');
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  const requestorRef = useRef<HTMLInputElement>(null);
  const departmentRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const vendorRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }),
    []
  );

  const totalCost = useMemo(
    () => orderLines.reduce((sum, line) => sum + (Number(line.total_price) || 0), 0),
    [orderLines]
  );

  const focusFirstInvalidField = () => {
    if (!requestorName.trim()) {
      requestorRef.current?.focus();
      return;
    }
    if (!department.trim()) {
      departmentRef.current?.focus();
      return;
    }
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    if (!vendorName.trim()) {
      vendorRef.current?.focus();
    }
  };

  const validateForm = (): string | null => {
    if (!requestorName.trim() || !title.trim() || !vendorName.trim() || !department.trim()) {
      return 'Please fill in all required fields.';
    }
    if (orderLines.length === 0) {
      return 'Please add at least one order line.';
    }
    return null;
  };

  const handleAddLine = () => {
    setOrderLines((prev) => [...prev, createEmptyLine(Date.now())]);
  };

  const handleRemoveLine = (index: number) => {
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeLine = (index: number, updated: OrderLine) => {
    setOrderLines((prev) => prev.map((line, i) => (i === index ? updated : line)));
  };

  const hasUserEnteredLines = orderLines.some(
    (line) =>
      line.position_description.trim() ||
      Number(line.amount) > 0 ||
      Number(line.unit_price) > 0 ||
      Number(line.total_price) > 0
  );

  const applyOfferExtraction = (result: OfferExtractionResult) => {
    if (result.vendor_name && !vendorName) setVendorName(result.vendor_name);
    if (result.vendor_vat_id) setVendorVatId(result.vendor_vat_id);
    if (result.department && !department) setDepartment(result.department);
    if (result.title && !title) setTitle(result.title);
    if (
      result.commodity_group_suggestion &&
      COMMODITY_GROUPS.includes(result.commodity_group_suggestion) &&
      !commodityGroup
    ) {
      setCommodityGroup(result.commodity_group_suggestion);
    }
    if (
      Array.isArray(result.order_lines) &&
      result.order_lines.length > 0 &&
      !hasUserEnteredLines
    ) {
      setOrderLines(result.order_lines);
    }
  };

  const handleOfferFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setOfferFile(file);
    setParseMessage(null);

    if (!file) {
      setParseState('idle');
      return;
    }

    setParseState('loading');
    setParseMessage('Parsing offer and extracting data...');

    try {
      const parsed = await parseOffer(file);
      applyOfferExtraction(parsed);
      setParseState('success');
      setParseMessage('Offer parsed. Fields were pre-filled where possible.');
    } catch (error) {
      console.error('Offer parsing failed', error);
      const message =
        error instanceof ApiError ? error.message : 'Failed to parse the offer. Please try again.';
      setParseState('error');
      setParseMessage(message);
    }
  };

  const buildPayload = (): CreateProcurementRequestPayload => ({
    requestor_name: requestorName.trim(),
    title: title.trim(),
    vendor_name: vendorName.trim(),
    vendor_vat_id: vendorVatId.trim(),
    department: department.trim(),
    commodity_group: commodityGroup || null,
    order_lines: orderLines.map((line) => {
      const sanitized = {
        ...(line.id ? { id: line.id } : {}),
        position_description: line.position_description.trim(),
        unit: line.unit.trim(),
        unit_price: Number(line.unit_price) || 0,
        amount: Number(line.amount) || 0,
        total_price: Number(line.total_price) || 0,
      };
      return sanitized;
    }),
    total_cost: Number(totalCost.toFixed(2)),
  });

  const resetForm = () => {
    setRequestorName('');
    setTitle('');
    setVendorName('');
    setVendorVatId('');
    setDepartment('');
    setCommodityGroup('');
    setOrderLines([createEmptyLine(0)]);
    setOfferFile(null);
    setParseState('idle');
    setParseMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      focusFirstInvalidField();
      alertRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const created = await createProcurementRequest(payload);
      setSuccessMessage(`Request created (ID: ${created.id}). Redirecting...`);
      resetForm();
      router.push(`/requests/${created.id}`);
    } catch (error) {
      console.error('Submitting the request failed', error);
      const message =
        error instanceof ApiError
          ? error.message
          : 'Submitting the request failed. Please retry.';
      setErrorMessage(message);
      alertRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card asChild className="shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardHeader>
          <CardTitle>New procurement request</CardTitle>
          <CardDescription>
            Capture a new purchasing request. Upload an offer PDF to auto-fill vendor and line items.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive" ref={alertRef} tabIndex={-1}>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert ref={alertRef} tabIndex={-1}>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Requestor name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={requestorRef}
                value={requestorName}
                onChange={(e) => setRequestorName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Department <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={departmentRef}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Marketing, IT, ..."
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                Title / Short description <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New laptop for design team"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Vendor name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={vendorRef}
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Apple, Example GmbH, ..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Vendor VAT ID</Label>
              <Input
                value={vendorVatId}
                onChange={(e) => setVendorVatId(e.target.value)}
                placeholder="DE123456789"
              />
            </div>

            <div className="space-y-2">
              <Label>Commodity group</Label>
              <Select
                value={commodityGroup || undefined}
                onValueChange={(value) => setCommodityGroup(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto (backend suggestion possible)" />
                </SelectTrigger>
                <SelectContent>
                  {COMMODITY_GROUPS.map((cg) => (
                    <SelectItem key={cg} value={cg}>
                      {cg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Leave empty to let the backend suggest a commodity group.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Offer PDF (optional)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleOfferFileChange}
                disabled={isSubmitting}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {offerFile && <span className="font-medium">Selected: {offerFile.name}</span>}
                {parseState === 'loading' && <Badge variant="secondary">Parsing...</Badge>}
                {parseState === 'success' && <Badge variant="secondary">Parsed</Badge>}
                {parseState === 'error' && (
                  <Badge variant="destructive" className="text-xs">
                    Parse failed
                  </Badge>
                )}
                {parseMessage && <span className="text-slate-500">{parseMessage}</span>}
              </div>
              <p className="text-xs text-slate-500">
                Upload an offer from the vendor to auto-extract items and totals (calls /offers/parse).
              </p>
            </div>
          </div>

          <Separator />

          <RequestLinesTable
            lines={orderLines}
            onAddLine={handleAddLine}
            onRemoveLine={handleRemoveLine}
            onChangeLine={handleChangeLine}
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Total cost:</span>
            <Badge variant="secondary">{currencyFormatter.format(totalCost || 0)}</Badge>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit request'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
