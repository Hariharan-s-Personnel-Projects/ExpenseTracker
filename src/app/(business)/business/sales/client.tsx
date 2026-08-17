"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShoppingBag,
  Users,
  Loader2,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSalesProducts,
  recordSales,
  type SalesProduct,
  type SaleRecord,
} from "@/actions/sales";
import { type CustomerSegment } from "@/actions/customers";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const typeConfig: Record<string, { className: string }> = {
  B2B: { className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  B2C: { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  Other: { className: "bg-muted text-muted-foreground border-border/50" },
};

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0)
    return <span className="text-[10px] font-semibold text-destructive">Out of Stock</span>;
  if (qty <= 5)
    return <span className="text-[10px] font-semibold text-amber-600">{qty} left</span>;
  return <span className="text-[10px] text-muted-foreground">{qty} in stock</span>;
}

interface Props {
  segments: CustomerSegment[];
  initialProducts: SalesProduct[];
  initialSegmentId: string | null;
  recentSales: SaleRecord[];
  role: "owner" | "admin" | "member";
}

export default function SalesClient({
  segments,
  initialProducts,
  initialSegmentId,
  recentSales: initialRecentSales,
  role,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(initialSegmentId);
  const [products, setProducts] = useState<SalesProduct[]>(initialProducts);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loadingSegment, setLoadingSegment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentSales, setRecentSales] = useState<SaleRecord[]>(initialRecentSales);

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

  async function handleSegmentChange(segmentId: string) {
    if (segmentId === selectedSegmentId) return;
    setSelectedSegmentId(segmentId);
    setQuantities({});
    setLoadingSegment(true);
    const data = await getSalesProducts(segmentId);
    setProducts(data);
    setLoadingSegment(false);
  }

  const lineItems = products
    .map((p) => ({ ...p, qty: parseInt(quantities[p.id] ?? "0") || 0 }))
    .filter((p) => p.qty > 0);

  const orderTotal = lineItems.reduce((s, p) => s + p.sellingPrice * p.qty, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSegmentId || !selectedSegment || lineItems.length === 0) return;

    // Validate stock
    for (const item of lineItems) {
      if (item.qty > item.currentStock) {
        toast.error(`"${item.name}" only has ${item.currentStock} in stock`);
        return;
      }
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.set("segmentId", selectedSegmentId);
    fd.set("segmentName", selectedSegment.name);
    fd.set("saleDate", saleDate);
    fd.set("notes", notes);
    fd.set(
      "items",
      JSON.stringify(
        lineItems.map((p) => ({
          productId: p.id,
          productName: p.name,
          categoryName: p.categoryName,
          quantity: p.qty,
          sellingPrice: p.sellingPrice,
        }))
      )
    );

    const res = await recordSales(fd);
    setSubmitting(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`${res.count} product${res.count !== 1 ? "s" : ""} sold — inventory updated`);
      setQuantities({});
      setNotes("");
      startTransition(() => router.refresh());
    }
  }

  // Group products by category for display
  const grouped = products.reduce<Record<string, { categoryName: string; items: SalesProduct[] }>>(
    (acc, p) => {
      if (!acc[p.categoryId]) acc[p.categoryId] = { categoryName: p.categoryName, items: [] };
      acc[p.categoryId].items.push(p);
      return acc;
    },
    {}
  );

  const numCell = "w-24 px-3 py-2 bg-transparent text-sm text-right tabular-nums border border-transparent rounded focus:border-primary/40 focus:bg-primary/5 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          Register Sale
        </h1>
        <p className="text-sm text-muted-foreground">
          Select a customer segment, enter quantities, and submit to log the sale.
        </p>
      </motion.div>

      {/* No segments */}
      {segments.length === 0 ? (
        <motion.div variants={fadeUp} className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-8 py-16 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No customer segments configured</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Create segments before registering sales.</p>
          <Button asChild size="sm" className="mt-4 gap-2">
            <Link href="/business/customers"><Users className="h-4 w-4" />Manage Segments</Link>
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Segment tabs */}
          <motion.div variants={fadeUp}>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Customer Segment
            </Label>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {segments.map((seg) => {
                const isActive = seg.id === selectedSegmentId;
                const tc = typeConfig[seg.type] ?? typeConfig.Other;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => handleSegmentChange(seg.id)}
                    disabled={loadingSegment || submitting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-60 ${
                      isActive
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {seg.name}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${tc.className}`}>
                      {seg.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Sale date + notes row */}
          <motion.div variants={fadeUp} className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1.5">
              <Label htmlFor="sale-date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sale Date
              </Label>
              <Input
                id="sale-date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="bg-muted/30 border-border/50 h-9 text-sm w-44"
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label htmlFor="sale-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes (optional)
              </Label>
              <Input
                id="sale-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Order #1234, walk-in customer"
                className="bg-muted/30 border-border/50 h-9 text-sm"
              />
            </div>
          </motion.div>

          {/* Products table */}
          <motion.div variants={fadeUp} className="space-y-6">
            {loadingSegment ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-6 py-12 text-center">
                <ShoppingBag className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No products with selling prices configured for this segment.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Set up margins in <Link href="/business/product-margins" className="underline underline-offset-2">Product Margins</Link> first.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([catId, { categoryName, items }]) => (
                <div key={catId} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] px-1">{categoryName}</p>
                  <Card className="border-border/50">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[180px]">Product</th>
                              <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[100px] border-l border-border/20 whitespace-nowrap">Selling Price</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[110px] border-l border-border/20 whitespace-nowrap">Stock</th>
                              <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[100px] border-l border-border/20 whitespace-nowrap">Qty to Sell</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-primary/70 uppercase tracking-wide min-w-[110px] border-l border-border/30 whitespace-nowrap">Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((product) => {
                              const qty = parseInt(quantities[product.id] ?? "0") || 0;
                              const lineTotal = product.sellingPrice * qty;
                              const overStock = qty > product.currentStock;
                              return (
                                <tr key={product.id} className={`border-b border-border/20 transition-colors ${qty > 0 ? "bg-primary/5" : "hover:bg-muted/10"}`}>
                                  <td className="px-4 py-2.5 font-medium min-w-[180px]">{product.name}</td>
                                  <td className="px-3 py-2.5 text-right tabular-nums border-l border-border/20">
                                    {formatCurrency(product.sellingPrice)}
                                  </td>
                                  <td className="px-3 py-2.5 border-l border-border/20 min-w-[110px]">
                                    <StockBadge qty={product.currentStock} />
                                  </td>
                                  <td className={`px-1 py-1 border-l border-border/20 min-w-[100px] ${overStock ? "bg-destructive/5" : ""}`}>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      max={product.currentStock}
                                      value={quantities[product.id] ?? ""}
                                      onChange={(e) => setQuantities((prev) => ({ ...prev, [product.id]: e.target.value }))}
                                      placeholder="0"
                                      disabled={product.currentStock === 0}
                                      className={`${numCell} ${overStock ? "text-destructive" : ""} disabled:opacity-30 disabled:cursor-not-allowed`}
                                    />
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums border-l border-border/30 min-w-[110px] whitespace-nowrap">
                                    {qty > 0 ? (
                                      <span className={overStock ? "text-destructive" : "text-primary"}>
                                        {formatCurrency(lineTotal)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground/30">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </motion.div>

          {/* Order summary + submit */}
          {lineItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky bottom-4"
            >
              <Card className="border-primary/30 bg-card shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Order Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {lineItems.length} product{lineItems.length !== 1 ? "s" : ""} ·{" "}
                        {lineItems.reduce((s, p) => s + p.qty, 0)} units
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                        <p className="text-xl font-bold text-primary tabular-nums">{formatCurrency(orderTotal)}</p>
                      </div>
                      <Button type="submit" disabled={submitting} className="gap-2 h-10 px-6">
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {submitting ? "Recording…" : "Register Sale"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </form>
      )}

      {/* Recent sales history */}
      {recentSales.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-3 pt-4 border-t border-border/30">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            Recent Sales
            <span className="text-xs text-muted-foreground bg-muted/50 border border-border/40 px-2 py-0.5 rounded-full">
              {recentSales.length}
            </span>
            {showHistory ? <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" /> : <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />}
          </button>

          {showHistory && (
            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[140px]">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Segment</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-l border-border/20">Qty</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-l border-border/20">Unit Price</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-primary/70 uppercase tracking-wide whitespace-nowrap border-l border-border/30">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                          <td className="px-4 py-2.5 font-medium">{sale.product_name}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{sale.segment_name}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums border-l border-border/20">{sale.quantity}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums border-l border-border/20">{formatCurrency(sale.selling_price_per_unit)}</td>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums text-primary border-l border-border/30">{formatCurrency(sale.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
