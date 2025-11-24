// src/components/RequestLinesTable.tsx

'use client';

import React from 'react';
import type { OrderLine } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface RequestLinesTableProps {
  lines: OrderLine[];
  onChangeLine: (index: number, updated: OrderLine) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}

export const RequestLinesTable: React.FC<RequestLinesTableProps> = ({
  lines,
  onChangeLine,
  onAddLine,
  onRemoveLine,
}) => {
  const handleFieldChange = (
    index: number,
    field: keyof OrderLine,
    value: string
  ) => {
    const line = lines[index];
    let newValue: any = value;

    if (field === 'unit_price' || field === 'amount' || field === 'total_price') {
      newValue = Number(value) || 0;
    }

    const updated: OrderLine = {
      ...line,
      [field]: newValue,
    };

    // Recalculate total_price if unit_price or amount changed
    if (field === 'unit_price' || field === 'amount') {
      updated.total_price =
        (Number(updated.unit_price) || 0) * (Number(updated.amount) || 0);
    }

    onChangeLine(index, updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Order lines</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddLine}
        >
          + Add line
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Unit price</TableHead>
              <TableHead className="w-[100px]">Amount</TableHead>
              <TableHead className="w-[100px]">Unit</TableHead>
              <TableHead className="w-[120px]">Total</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-slate-500">
                  No order lines yet. Add at least one.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={line.position_description}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          'position_description',
                          e.target.value
                        )
                      }
                      placeholder="e.g. MacBook Air 13-inch"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unit_price ?? 0}
                      onChange={(e) =>
                        handleFieldChange(index, 'unit_price', e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={line.amount ?? 0}
                      onChange={(e) =>
                        handleFieldChange(index, 'amount', e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.unit}
                      onChange={(e) =>
                        handleFieldChange(index, 'unit', e.target.value)
                      }
                      placeholder="Stk"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      readOnly
                      value={line.total_price ?? 0}
                      className="bg-slate-50"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => onRemoveLine(index)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
