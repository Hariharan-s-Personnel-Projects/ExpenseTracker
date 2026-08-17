"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Boxes, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { setInventoryQuantity, type InventoryCategory } from "@/actions/inventory";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-destructive/10 text-destructive border-destructive/20 uppercase tracking-wider">
        Out of Stock
      </span>
    );
  if (qty <= 5)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase tracking-wider">
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase tracking-wider">
      In Stock
    </span>
  );
}

interface EditableRow {
  id: string;
  name: string;
  quantity: string;
  updated_at: string | null;
}

interface Props {
  groups: InventoryCategory[];
  role: "owner" | "admin" | "member" | "sales";
}

function CategoryInventoryTable({
  group,
  role,
  onRefresh,
}: {
  group: InventoryCategory;
  role: "owner" | "admin" | "member" | "sales";
  onRefresh: () => void;
}) {
  const [rows, setRows] = useState<EditableRow[]>(() =>
    group.products.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity.toString(),
      updated_at: p.updated_at,
    }))
  );
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const savedRef = useRef<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const canManage = role === "owner" || role === "admin";

  useEffect(() => {
    const synced = group.products.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity.toString(),
      updated_at: p.updated_at,
    }));
    setRows(synced);
    savedRef.current = Object.fromEntries(synced.map((r) => [r.id, r.quantity]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.products]);

  async function saveRow(rowId: string) {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const saved = savedRef.current[rowId];
    const qty = parseInt(row.quantity) || 0;
    if (saved === row.quantity) return;

    setSavingIds((prev) => new Set(prev).add(rowId));
    const res = await setInventoryQuantity(rowId, qty);
    setSavingIds((prev) => { const s = new Set(prev); s.delete(rowId); return s; });

    if (res?.error) {
      toast.error(res.error);
      setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, quantity: saved ?? "0" } : r));
    } else {
      savedRef.current[rowId] = row.quantity;
      onRefresh();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const nextRef = inputRefs.current[`${rowIdx + 1}`];
      if (nextRef) nextRef.focus(); else e.currentTarget.blur();
    } else if (e.key === "Escape") {
      const saved = savedRef.current[rows[rowIdx]?.id];
      if (saved !== undefined) setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, quantity: saved } : r));
      e.currentTarget.blur();
    }
  }

  const numCell = "w-20 px-3 py-2 bg-transparent text-sm text-right tabular-nums border border-transparent rounded focus:border-primary/40 focus:bg-primary/5 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight">{group.name}</h2>

      {group.products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">No products in this category.</p>
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10">#</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]">Product</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[120px] border-l border-border/20 whitespace-nowrap">
                      Qty in Stock
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[120px] border-l border-border/20 whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[160px] border-l border-border/20 whitespace-nowrap">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    const qty = parseInt(row.quantity) || 0;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) saveRow(row.id);
                        }}
                      >
                        <td className="px-4 py-2 text-xs text-muted-foreground/40 font-medium w-10">{rowIdx + 1}</td>
                        <td className="px-3 py-2 font-medium min-w-[200px]">{row.name}</td>
                        <td className="px-1 py-1 text-right border-l border-border/20 min-w-[120px]">
                          {canManage ? (
                            <div className="flex items-center justify-end gap-1">
                              {savingIds.has(row.id) && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/40" />
                              )}
                              <input
                                ref={(el) => { inputRefs.current[`${rowIdx}`] = el; }}
                                type="number"
                                min="0"
                                step="1"
                                value={row.quantity}
                                onChange={(e) => setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, quantity: e.target.value } : r))}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx)}
                                disabled={savingIds.has(row.id)}
                                className={numCell}
                              />
                            </div>
                          ) : (
                            <span className="px-3 py-2 font-semibold tabular-nums">{qty}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 border-l border-border/20 min-w-[120px]">
                          <StockBadge qty={qty} />
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground border-l border-border/20 min-w-[160px] whitespace-nowrap">
                          {row.updated_at ? formatDate(row.updated_at) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {canManage && (
              <div className="px-4 py-2 border-t border-border/20 bg-muted/10">
                <p className="text-xs text-muted-foreground/50">
                  Click quantity to edit · Enter or Tab to move · Esc to revert · Saves automatically · Stock increases automatically on purchase
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function InventoryClient({ groups, role }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() { startTransition(() => router.refresh()); }

  const totalProducts = groups.reduce((s, g) => s + g.products.length, 0);
  const outOfStock = groups.reduce(
    (s, g) => s + g.products.filter((p) => p.quantity === 0).length,
    0
  );
  const lowStock = groups.reduce(
    (s, g) => s + g.products.filter((p) => p.quantity > 0 && p.quantity <= 5).length,
    0
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Boxes className="h-6 w-6 text-primary" />
          Inventory
        </h1>
        <p className="text-sm text-muted-foreground">
          Stock levels update automatically when purchases are recorded.
        </p>
      </motion.div>

      {/* Summary chips */}
      {totalProducts > 0 && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Products</span>
            <span className="text-sm font-bold tabular-nums">{totalProducts}</span>
          </div>
          {outOfStock > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Out of Stock</span>
              <span className="text-sm font-bold tabular-nums text-destructive">{outOfStock}</span>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Low Stock</span>
              <span className="text-sm font-bold tabular-nums text-amber-600">{lowStock}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Tables */}
      {groups.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-8 py-16 text-center"
        >
          <Boxes className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No products found.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add products in the Product Catalog first.</p>
        </motion.div>
      ) : (
        groups.map((group) => (
          <motion.div key={group.id} variants={fadeUp}>
            <CategoryInventoryTable group={group} role={role} onRefresh={refresh} />
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
