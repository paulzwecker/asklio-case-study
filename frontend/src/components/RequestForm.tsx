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
import { RocketLaunch } from '@/components/RocketLaunch';

type ParseState = 'idle' | 'loading' | 'success' | 'error';

const createEmptyLine = (seed: number): OrderLine => ({
  id: seed,
  position_description: '',
  unit_price: 0,
  amount: 0,
  unit: '',
  total_price: 0,
});

// Helper to safely parse numbers, including "1,23" style inputs
const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Small loading dots component (three bouncing dots)
const LoadingDots: React.FC = () => (
  <span className="ml-1 inline-flex items-center gap-1">
    <span
      className="h-1.5 w-1.5 rounded-full bg-slate-700 animate-bounce"
      style={{ animationDelay: '0s' }}
    />
    <span
      className="h-1.5 w-1.5 rounded-full bg-slate-700 animate-bounce"
      style={{ animationDelay: '0.15s' }}
    />
    <span
      className="h-1.5 w-1.5 rounded-full bg-slate-700 animate-bounce"
      style={{ animationDelay: '0.3s' }}
    />
  </span>
);

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
  const [isDragOver, setIsDragOver] = useState(false);

  // 🚀 rocket launch state
  const [isLaunching, setIsLaunching] = useState(false);
  const [pendingRedirectId, setPendingRedirectId] = useState<string | null>(null);

  const requestorRef = useRef<HTMLInputElement>(null);
  const departmentRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const vendorRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormDisabled = isSubmitting || isLaunching;
  const isParsingOffer = parseState === 'loading';
  const isUploadDisabled = isFormDisabled || isParsingOffer;

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
    if (isFormDisabled) return;
    setOrderLines((prev) => [...prev, createEmptyLine(Date.now())]);
  };

  const handleRemoveLine = (index: number) => {
    if (isFormDisabled) return;
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeLine = (index: number, updated: OrderLine) => {
    if (isFormDisabled) return;
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
    // Requestor name: use model value if present, otherwise "Unknown" (if still empty)
    if (!requestorName) {
      const fromModel = result.requestor_name ?? null;
      setRequestorName(fromModel && fromModel.trim().length > 0 ? fromModel : 'Unknown');
    }

    // Vendor name: only set if model has it and user hasn’t typed anything
    if (result.vendor_name && !vendorName) {
      setVendorName(result.vendor_name);
    }

    // VAT: optional, only set if present
    if (result.vendor_vat_id) {
      setVendorVatId(result.vendor_vat_id);
    }

    // Department: use model value if present, otherwise "Unknown" (if still empty)
    if (!department) {
      const fromModel = result.department ?? null;
      setDepartment(fromModel && fromModel.trim().length > 0 ? fromModel : 'Unknown');
    }

    // Title: only set if model has it and user hasn’t typed anything
    if (result.title && !title) {
      setTitle(result.title);
    }

    // Commodity group: only set if suggestion is one of our known groups and we haven't chosen one yet
    if (
      result.commodity_group_suggestion &&
      COMMODITY_GROUPS.includes(result.commodity_group_suggestion) &&
      !commodityGroup
    ) {
      setCommodityGroup(result.commodity_group_suggestion);
    }

    // Order lines: only overwrite if user hasn't entered anything yet
    if (
      Array.isArray(result.order_lines) &&
      result.order_lines.length > 0 &&
      !hasUserEnteredLines
    ) {
      setOrderLines(result.order_lines);
    }
  };

  const parseOfferFile = async (file: File | null) => {
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

  const handleOfferFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploadDisabled) return;
    const file = event.target.files?.[0] ?? null;
    await parseOfferFile(file);
  };

  const handleFileUploadClick = () => {
    if (isUploadDisabled) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (isUploadDisabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (isUploadDisabled) return;
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (isUploadDisabled) return;
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (isUploadDisabled) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setParseState('error');
      setParseMessage('Only PDF files are supported.');
      return;
    }

    await parseOfferFile(file);
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
        unit_price: parseNumber(line.unit_price),
        amount: parseNumber(line.amount),
        total_price: parseNumber(line.total_price),
      };
      return sanitized;
    }),
    total_cost: parseNumber(totalCost.toFixed(2)),
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

  // 🚀 When the rocket animation finishes, navigate
  const handleRocketComplete = () => {
    const id = pendingRedirectId;
    setIsLaunching(false);
    resetForm();

    if (id) {
      router.push(`/requests/${id}`);
    } else {
      router.push('/requests');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isFormDisabled) return;

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

      const createdId = (created as any)?.id;

      if (createdId) {
        setPendingRedirectId(createdId);
        setSuccessMessage(`Request created (ID: ${createdId}). Launching...`);
        setIsLaunching(true); // start rocket animation
      } else {
        console.warn('createProcurementRequest result has no id:', created);
        setPendingRedirectId(null);
        setSuccessMessage('Request created. Launching overview...');
        setIsLaunching(true);
      }
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

  const submitLabel = isLaunching
    ? 'Launching'
    : isSubmitting
    ? 'Submitting'
    : 'Submit request';

  return (
    <>
      <div className="relative">
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
                    disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vendor VAT ID</Label>
                  <Input
                    value={vendorVatId}
                    onChange={(e) => setVendorVatId(e.target.value)}
                    placeholder="DE123456789"
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Commodity group</Label>
                  <Select
                    value={commodityGroup || undefined}
                    onValueChange={(value) => setCommodityGroup(value)}
                    disabled={isFormDisabled}
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

                {/* Upload section with its own parsing overlay */}
                <div className="space-y-2 md:col-span-2 mt-5 relative">
                  <Label>Offer PDF (optional)</Label>

                  {/* Hidden native input */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleOfferFileChange}
                    disabled={isUploadDisabled}
                    className="hidden"
                  />

                  {/* Clickable + droppable area */}
                  <div
                    onClick={handleFileUploadClick}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center rounded-md border border-dashed p-4 text-center text-sm transition-colors ${
                      isUploadDisabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                        : isDragOver
                        ? 'cursor-pointer border-primary bg-primary/5'
                        : 'cursor-pointer border-slate-300 hover:border-primary/70 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-medium text-slate-800">
                      Click to upload a PDF or drag &amp; drop it here
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      Only PDF files are supported. We’ll auto-extract vendor and line items.
                    </span>
                    {offerFile && (
                      <span className="mt-2 text-xs text-slate-600">
                        Selected: <span className="font-medium">{offerFile.name}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {parseState === 'loading' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Parsing
                        <LoadingDots />
                      </Badge>
                    )}
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

                  {/* Upload-only overlay while parsing */}
                  {isParsingOffer && (
                    <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/70 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2 text-xs text-slate-800">
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
                        <div className="font-medium">
                          Reading your offer
                          <LoadingDots />
                        </div>
                      </div>
                    </div>
                  )}
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
                <span className="font-medium">Total cost (net):</span>
                <Badge variant="secondary">{currencyFormatter.format(totalCost || 0)}</Badge>
              </div>
              <Button
                type="submit"
                disabled={isFormDisabled}
                className={isFormDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              >
                <span className="flex items-center">
                  {submitLabel}
                  {(isSubmitting || isLaunching) && <LoadingDots />}
                </span>
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Full-form overlay while submitting / launching */}
        {isFormDisabled && (
          <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-sm text-slate-800">
              <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
              <div className="font-medium">
                {isLaunching ? 'Launching your request' : 'Submitting your request'}
                <LoadingDots />
              </div>
              <p className="text-xs text-slate-500">
                Please hold on, we’re processing your request.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 Rocket overlay */}
      <RocketLaunch isVisible={isLaunching} onComplete={handleRocketComplete} />
    </>
  );
};
