"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Loader2, Upload } from "lucide-react";
import { useCreateBulkExpenses } from "@/hooks/useExpenses";
import { useRouter } from "next/navigation";
import { CreateExpensePayload } from "@/types";
import { cn } from "@/lib/utils";

type BulkRow = {
  id: string;
  amount: string;
  description: string;
  major_category: string;
  category: string;
  expense_date: string;
  customCategoryMode: boolean;
};

type RowErrors = Record<
  string,
  { amount?: string; category?: string; expense_date?: string }
>;

type Props = {
  majorCategoryOptions: string[];
  subCategoryOptions: string[];
};

const TODAY = new Date().toISOString().split("T")[0];

function createEmptyRow(id: string): BulkRow {
  return {
    id,
    amount: "",
    description: "",
    major_category: "Daily Expense",
    category: "",
    expense_date: TODAY,
    customCategoryMode: false,
  };
}

// Shared select styling — matches the Input component's look
const selectCls =
  "w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function BulkExpenseTab({
  majorCategoryOptions,
  subCategoryOptions,
}: Props) {
  const router = useRouter();
  const { mutateAsync: submitBulk, isPending } = useCreateBulkExpenses();
  const rowCounter = useRef(3);

  const [rows, setRows] = useState<BulkRow[]>(() => [
    createEmptyRow("0"),
    createEmptyRow("1"),
    createEmptyRow("2"),
  ]);
  const [errors, setErrors] = useState<RowErrors>({});

  const addRow = () => {
    const id = String(rowCounter.current++);
    setRows((prev) => [...prev, createEmptyRow(id)]);
  };

  const deleteRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateField = (id: string, field: keyof BulkRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "major_category") {
          updated.category = value !== "Daily Expense" ? value : "";
          updated.customCategoryMode = false;
        }
        return updated;
      }),
    );
    setErrors((prev) => {
      const rowErr = prev[id];
      if (!rowErr) return prev;
      const key =
        field === "amount"
          ? "amount"
          : field === "expense_date"
            ? "expense_date"
            : "category";
      return { ...prev, [id]: { ...rowErr, [key]: undefined } };
    });
  };

  const handleCategorySelect = (id: string, value: string) => {
    if (value === "__custom__") {
      setRows((prev) =>
        prev.map((r) =>
          r.id !== id ? r : { ...r, customCategoryMode: true, category: "" },
        ),
      );
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.id !== id
            ? r
            : { ...r, category: value, customCategoryMode: false },
        ),
      );
    }
    setErrors((prev) => ({
      ...prev,
      [id]: { ...prev[id], category: undefined },
    }));
  };

  const cancelCustom = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id !== id ? r : { ...r, customCategoryMode: false, category: "" },
      ),
    );
  };

  const validate = (): boolean => {
    const newErrors: RowErrors = {};
    for (const row of rows) {
      const errs: RowErrors[string] = {};
      const amt = parseFloat(row.amount);
      if (!row.amount || isNaN(amt) || amt <= 0) errs.amount = "Must be > 0";
      if (!row.category.trim()) errs.category = "Required";
      if (!row.expense_date) errs.expense_date = "Required";
      if (Object.keys(errs).length) newErrors[row.id] = errs;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: CreateExpensePayload[] = rows.map((row) => ({
      amount: parseFloat(row.amount),
      description: row.description.trim() || undefined,
      major_category: row.major_category,
      category: row.category,
      expense_date: row.expense_date,
    }));
    try {
      await submitBulk(payload);
      router.push("/dashboard");
    } catch {
      // error handled by hook toast
    }
  };

  // ── Sub-category cell shared between card and table views ──────────────────
  const SubCategoryField = ({
    row,
    inputHeight,
  }: {
    row: BulkRow;
    inputHeight: string;
  }) => {
    if (row.major_category !== "Daily Expense") {
      return (
        <span className="text-xs text-muted-foreground italic">Auto</span>
      );
    }
    if (row.customCategoryMode) {
      return (
        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Type sub-category..."
            value={row.category}
            onChange={(e) => updateField(row.id, "category", e.target.value)}
            className={cn(
              inputHeight,
              "text-sm flex-1",
              errors[row.id]?.category && "border-destructive",
            )}
            autoFocus
          />
          <button
            type="button"
            onClick={() => cancelCustom(row.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground text-xs leading-none"
            title="Back to list"
          >
            ✕
          </button>
        </div>
      );
    }
    return (
      <>
        <select
          value={row.category}
          onChange={(e) => handleCategorySelect(row.id, e.target.value)}
          className={cn(
            selectCls,
            inputHeight,
            errors[row.id]?.category && "border-destructive",
          )}
        >
          <option value="">Select...</option>
          {subCategoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="__custom__">+ Custom...</option>
        </select>
        {errors[row.id]?.category && (
          <p className="text-xs text-destructive mt-0.5">
            {errors[row.id].category}
          </p>
        )}
      </>
    );
  };

  // ── Footer ─────────────────────────────────────────────────────────────────
  const Footer = () => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        className="gap-1.5 w-full sm:w-auto"
      >
        <PlusCircle className="h-4 w-4" />
        Add Row
      </Button>
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-sm text-muted-foreground">
          {rows.length} row{rows.length !== 1 ? "s" : ""}
        </span>
        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isPending
            ? "Submitting..."
            : `Submit ${rows.length} Expense${rows.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle>Bulk Expense Entry</CardTitle>
        <CardDescription>
          Fill in multiple expenses below. All rows will be saved at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Mobile: card-per-row layout (hidden on sm+) ── */}
        <div className="sm:hidden space-y-3">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="rounded-xl border border-border bg-card p-3.5 space-y-3"
            >
              {/* Row header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Entry {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => deleteRow(row.id)}
                  disabled={rows.length === 1}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors p-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Amount (₹)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={row.amount}
                    onChange={(e) =>
                      updateField(row.id, "amount", e.target.value)
                    }
                    className={cn(
                      "h-9",
                      errors[row.id]?.amount && "border-destructive",
                    )}
                  />
                  {errors[row.id]?.amount && (
                    <p className="text-xs text-destructive">
                      {errors[row.id].amount}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input
                    type="date"
                    value={row.expense_date}
                    onChange={(e) =>
                      updateField(row.id, "expense_date", e.target.value)
                    }
                    className={cn(
                      "h-9",
                      errors[row.id]?.expense_date && "border-destructive",
                    )}
                  />
                  {errors[row.id]?.expense_date && (
                    <p className="text-xs text-destructive">
                      {errors[row.id].expense_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Description{" "}
                  <span className="font-normal opacity-60">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g., Grocery shopping"
                  value={row.description}
                  onChange={(e) =>
                    updateField(row.id, "description", e.target.value)
                  }
                  className="h-9"
                />
              </div>

              {/* Major Category */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Major Category
                </Label>
                <select
                  value={row.major_category}
                  onChange={(e) =>
                    updateField(row.id, "major_category", e.target.value)
                  }
                  className={cn(selectCls, "h-9")}
                >
                  {majorCategoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub Category — only for Daily Expense */}
              {row.major_category === "Daily Expense" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Sub Category
                  </Label>
                  <SubCategoryField row={row} inputHeight="h-9" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Desktop: table layout (hidden on mobile) ── */}
        <div className="hidden sm:block -mx-6 px-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-2 w-6">
                  #
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-2 w-28">
                  Amount (₹)
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-2">
                  Description
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-2 w-40">
                  Major Category
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-2 w-44">
                  Sub Category
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-2 w-36">
                  Date
                </th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="py-2 pr-2 text-xs text-muted-foreground">
                    {idx + 1}
                  </td>

                  {/* Amount */}
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={row.amount}
                      onChange={(e) =>
                        updateField(row.id, "amount", e.target.value)
                      }
                      className={cn(
                        "h-8 text-sm",
                        errors[row.id]?.amount && "border-destructive",
                      )}
                    />
                    {errors[row.id]?.amount && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors[row.id].amount}
                      </p>
                    )}
                  </td>

                  {/* Description */}
                  <td className="py-2 pr-2">
                    <Input
                      placeholder="Optional"
                      value={row.description}
                      onChange={(e) =>
                        updateField(row.id, "description", e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </td>

                  {/* Major Category */}
                  <td className="py-2 pr-2">
                    <select
                      value={row.major_category}
                      onChange={(e) =>
                        updateField(row.id, "major_category", e.target.value)
                      }
                      className={cn(selectCls, "h-8")}
                    >
                      {majorCategoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Sub Category */}
                  <td className="py-2 pr-2">
                    <SubCategoryField row={row} inputHeight="h-8" />
                  </td>

                  {/* Date */}
                  <td className="py-2 pr-2">
                    <Input
                      type="date"
                      value={row.expense_date}
                      onChange={(e) =>
                        updateField(row.id, "expense_date", e.target.value)
                      }
                      className={cn(
                        "h-8 text-sm",
                        errors[row.id]?.expense_date && "border-destructive",
                      )}
                    />
                    {errors[row.id]?.expense_date && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors[row.id].expense_date}
                      </p>
                    )}
                  </td>

                  {/* Delete */}
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      disabled={rows.length === 1}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Footer />
      </CardContent>
    </Card>
  );
}
