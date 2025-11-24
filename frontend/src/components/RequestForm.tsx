// src/components/RequestForm.tsx

'use client';

import React, { useState, FormEvent, useMemo } from 'react';
import type { OrderLine } from '@/lib/types';
import { COMMODITY_GROUPS } from '@/lib/types';
// import { createProcurementRequest, parseOffer } from '@/lib/api';
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

export const RequestForm: React.FC = () => {
  const [requestorName, setRequestorName] = useState('');
  const [title, setTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorVatId, setVendorVatId] = useState('');
  const [department, setDepartment] = useState('');
  const [commodityGroup, setCommodityGroup] = useState<string>('');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalCost = useMemo(
    () => orderLines.reduce((sum, line) => sum + (line.total_price ?? 0), 0),
    [orderLines]
  );

  const handleAddLine = () => {
    setOrderLines((prev) => [
      ...prev,
      {
        id: prev.length,
        position_description: '',
        unit_price: 0,
        amount: 0,
        unit: '',
        total_price: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeLine = (index: number, updated: OrderLine) => {
    setOrderLines((prev) => prev.map((line, i) => (i === index ? updated : line)));
  };

  const handleOfferFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setOfferFile(null);
      return;
    }
    setOfferFile(file);
    // TODO: use parseOffer(file) to prefill form fields & order lines
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!requestorName || !title || !vendorName || !department) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (orderLines.length === 0) {
      setErrorMessage('Please add at least one order line.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        requestor_name: requestorName,
        title,
        vendor_name: vendorName,
        vendor_vat_id: vendorVatId,
        department,
        commodity_group: commodityGroup,
        order_lines: orderLines,
        total_cost: totalCost,
      };

      console.log('Submitting procurement request payload:', payload);
      setSuccessMessage(
        'Request was validated locally (API call to backend not wired yet).'
      );

      // Example for later:
      // const created = await createProcurementRequest(payload);
      // setSuccessMessage(`Request created with ID ${created.id}`);
    } catch (error) {
      console.error(error);
      setErrorMessage('Submitting the request failed. See console for details.');
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
            Capture a new purchasing request. You can upload an offer PDF to
            auto-fill vendor and line items later.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert>
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
                value={requestorName}
                onChange={(e) => setRequestorName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Department <span className="text-red-500">*</span>
              </Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Marketing, IT, ..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                Title / Short description{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New MacBook Air for designer"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Vendor name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Apple, styleGREEN, ..."
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
                  <SelectValue placeholder="Auto (to be suggested by backend)" />
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
                Later, this will be filled automatically by the backend classifier.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Offer PDF (optional)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleOfferFileChange}
              />
              <p className="text-xs text-slate-500">
                Upload an offer from the vendor to auto-extract items and totals
                (will call the backend <code>/offers/parse</code> endpoint).
              </p>
              {offerFile && (
                <p className="text-xs text-slate-600">
                  Selected file: <span className="font-medium">{offerFile.name}</span>
                </p>
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
            <span className="font-medium">Total cost:</span>
            <Badge variant="secondary">
              {totalCost.toFixed(2)} €
            </Badge>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit request'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
