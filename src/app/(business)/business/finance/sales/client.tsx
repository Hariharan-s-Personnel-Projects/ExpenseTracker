"use client";

import { motion } from "framer-motion";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Search, ShoppingCart, Pencil, Trash2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateSale, deleteSale, type SaleRecord } from "@/actions/sales";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const numInput =
  "w-full px-2 py-1 bg-muted/40 border border-border/50 rounded text-sm text-right tabular-nums focus:border-primary/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

interface Props {
  sales: SaleRecord[];
}

export default function SalesListClient({ sales: initialSales }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sales, setSales] = useState<SaleRecord[]>(initialSales);
  const [search, setSearch] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.product_name.toLowerCase().includes(q) ||
        s.category_name.toLowerCase().includes(q) ||
        s.segment_name.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total_amount, 0);
  const totalUnits = filtered.reduce((sum, s) => sum + s.quantity, 0);

  function startEdit(sale: SaleRecord) {
    setEditingId(sale.id);
    setEditQty(String(sale.quantity));
    setEditPrice(String(sale.selling_price_per_unit));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditQty("");
    setEditPrice("");
  }

  async function handleSave(sale: SaleRecord) {
    const qty = parseInt(editQty);
    const price = parseFloat(editPrice);
    if (!qty || qty <= 0 || isNaN(price) || price < 0) {
      toast.error("Enter a valid quantity and price");
      return;
    }

    setSavingId(sale.id);
    const res = await updateSale(sale.id, qty, price);
    setSavingId(null);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    setSales((prev) =>
      prev.map((s) =>
        s.id === sale.id
          ? { ...s, quantity: qty, selling_price_per_unit: price, total_amount: price * qty }
          : s
      )
    );
    toast.success("Sale updated");
    cancelEdit();
    startTransition(() => router.refresh());
  }

  async function handleDelete(sale: SaleRecord) {
    if (!confirm(`Delete sale of "${sale.product_name}" (${sale.quantity} units)? Inventory will be restored.`)) return;

    setDeletingId(sale.id);
    const res = await deleteSale(sale.id);
    setDeletingId(null);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    setSales((prev) => prev.filter((s) => s.id !== sale.id));
    toast.success("Sale deleted — inventory restored");
    startTransition(() => router.refresh());
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Sales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sales.length} transaction{sales.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Units Sold</p>
            <p className="text-2xl font-bold mt-1">{totalUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Transactions</p>
            <p className="text-2xl font-bold mt-1">{filtered.length.toLocaleString()}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product, category, segment…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/30 border-border/50 h-9"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {sales.length === 0 ? "No sales recorded yet." : "No results match your search."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Segment</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price/Unit</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                        <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filtered.map((sale) => {
                        const isEditing = editingId === sale.id;
                        const isSaving = savingId === sale.id;
                        const isDeleting = deletingId === sale.id;
                        const busy = isSaving || isDeleting;

                        return (
                          <tr
                            key={sale.id}
                            className={`transition-colors ${isEditing ? "bg-primary/5" : "hover:bg-muted/15"}`}
                          >
                            <td className="px-5 py-2.5 font-medium">{sale.product_name}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{sale.category_name}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant="outline" className="text-[11px] px-2 bg-primary/5 text-primary border-primary/20">
                                {sale.segment_name}
                              </Badge>
                            </td>

                            {isEditing ? (
                              <>
                                <td className="px-4 py-2 text-right">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className={`${numInput} w-20`}
                                    autoFocus
                                  />
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className={`${numInput} w-28`}
                                  />
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-primary">
                                  {formatCurrency((parseFloat(editPrice) || 0) * (parseInt(editQty) || 0))}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                                  {formatDate(sale.sale_date)}
                                </td>
                                <td className="px-5 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleSave(sale)}
                                      disabled={busy}
                                      className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                                      title="Save"
                                    >
                                      {isSaving ? (
                                        <span className="h-4 w-4 block border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      disabled={busy}
                                      className="p-1.5 rounded-md text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2.5 text-right font-medium tabular-nums">{sale.quantity}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                                  {formatCurrency(sale.selling_price_per_unit)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                                  {formatCurrency(sale.total_amount)}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                                  {formatDate(sale.sale_date)}
                                </td>
                                <td className="px-5 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => startEdit(sale)}
                                      disabled={!!editingId || busy}
                                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
                                      title="Edit"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(sale)}
                                      disabled={!!editingId || busy}
                                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                                      title="Delete"
                                    >
                                      {isDeleting ? (
                                        <span className="h-3.5 w-3.5 block border-2 border-destructive/40 border-t-destructive rounded-full animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border/30">
                  {filtered.map((sale) => {
                    const isEditing = editingId === sale.id;
                    const isSaving = savingId === sale.id;
                    const isDeleting = deletingId === sale.id;
                    const busy = isSaving || isDeleting;

                    return (
                      <div key={sale.id} className={`p-4 space-y-2 ${isEditing ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{sale.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {sale.category_name} · {formatDate(sale.sale_date)}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            {!isEditing && (
                              <>
                                <button
                                  onClick={() => startEdit(sale)}
                                  disabled={!!editingId || busy}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(sale)}
                                  disabled={!!editingId || busy}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                                >
                                  {isDeleting ? (
                                    <span className="h-3.5 w-3.5 block border-2 border-destructive/40 border-t-destructive rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Quantity</p>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={editQty}
                                  onChange={(e) => setEditQty(e.target.value)}
                                  className={numInput}
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Price/Unit</p>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className={numInput}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(sale)}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                              >
                                {isSaving ? (
                                  <span className="h-4 w-4 block border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={busy}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground border border-border/50 hover:bg-muted/40 transition-colors disabled:opacity-40"
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] px-1.5 bg-primary/5 text-primary border-primary/20">
                              {sale.segment_name}
                            </Badge>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{formatCurrency(sale.total_amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                {sale.quantity} × {formatCurrency(sale.selling_price_per_unit)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
