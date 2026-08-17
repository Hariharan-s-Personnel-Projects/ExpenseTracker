"use client";

import { useState } from "react";
import { Building2, Package, ChevronDown } from "lucide-react";
import { getSalesProducts, type SalesProduct } from "@/actions/sales";
import { type CustomerSegment } from "@/actions/customers";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

function StockStatus({ qty }: { qty: number }) {
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive/80">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive/70" />
        Out of Stock
      </span>
    );
  if (qty <= 5)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Limited Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      In Stock
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/30 bg-card p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-muted/50" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3.5 w-3/4 rounded bg-muted/50" />
        <div className="h-2.5 w-1/2 rounded bg-muted/40" />
      </div>
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="h-2 w-8 rounded bg-muted/40" />
          <div className="h-5 w-20 rounded bg-muted/50" />
        </div>
        <div className="h-2.5 w-14 rounded bg-muted/40" />
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2].map((cat) => (
        <section key={cat} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-24 rounded bg-muted/50 animate-pulse" />
            <div className="flex-1 h-px bg-border/40" />
            <div className="h-2.5 w-16 rounded bg-muted/40 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: cat === 1 ? 4 : 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface Props {
  businessName: string;
  segments: CustomerSegment[];
}

export default function CatalogDisplayClient({ businessName, segments }: Props) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [products, setProducts] = useState<SalesProduct[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSegmentChange(segmentId: string) {
    if (segmentId === selectedSegmentId) return;
    setSelectedSegmentId(segmentId);
    setLoading(true);
    const data = await getSalesProducts(segmentId);
    setProducts(data);
    setLoading(false);
  }

  const grouped = (products ?? []).reduce<Record<string, { categoryName: string; items: SalesProduct[] }>>(
    (acc, p) => {
      if (!acc[p.categoryId]) acc[p.categoryId] = { categoryName: p.categoryName, items: [] };
      acc[p.categoryId].items.push(p);
      return acc;
    },
    {}
  );

  const availableProducts = (products ?? []).filter((p) => p.currentStock > 0);
  const totalCategories = Object.keys(grouped).length;
  const hasData = products !== null;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Staff-only segment selector — subtle, low-opacity, top-right corner */}
      {segments.length > 0 && (
        <div className="fixed top-3 right-4 z-50">
          <div className="opacity-20 hover:opacity-85 focus-within:opacity-85 transition-opacity duration-300">
            <div className="flex items-center gap-1.5 bg-muted/60 backdrop-blur-sm border border-border/30 rounded-lg px-2.5 py-1.5 shadow-sm">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest select-none">
                View
              </span>
              <div className="relative">
                <select
                  value={selectedSegmentId ?? ""}
                  onChange={(e) => handleSegmentChange(e.target.value)}
                  className="appearance-none bg-transparent text-[11px] font-medium text-foreground pr-4 outline-none cursor-pointer"
                >
                  <option value="" disabled>Select…</option>
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.id}>
                      {seg.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 pb-2 border-b border-border/30">
          <div className="flex items-center justify-center gap-2.5">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{businessName}</h1>
          </div>
          <p className="text-sm text-muted-foreground min-h-[1.25rem]">
            {hasData && !loading
              ? `${availableProducts.length} product${availableProducts.length !== 1 ? "s" : ""} available${totalCategories > 0 ? ` across ${totalCategories} categor${totalCategories !== 1 ? "ies" : "y"}` : ""}`
              : "\u00A0"}
          </p>
        </div>

        {/* Catalog content */}
        {loading ? (
          <CatalogSkeleton />
        ) : !hasData ? (
          /* Pre-selection skeleton — awaiting customer */
          <CatalogSkeleton />
        ) : products!.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <p className="text-base font-medium text-muted-foreground">No products available</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(grouped).map(([catId, { categoryName, items }]) => (
              <section key={catId} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.14em]">
                    {categoryName}
                  </h2>
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-xs text-muted-foreground/50">
                    {items.filter((p) => p.currentStock > 0).length}/{items.length} available
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((product) => (
                    <div
                      key={product.id}
                      className={`rounded-2xl border bg-card p-5 flex flex-col gap-3 transition-all duration-200 ${
                        product.currentStock === 0
                          ? "border-border/30 opacity-50"
                          : "border-border/50 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary/60" />
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="font-semibold text-sm leading-snug truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.categoryName}</p>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">Price</p>
                          <p className="text-lg font-bold text-primary tabular-nums leading-tight">
                            {formatCurrency(product.sellingPrice)}
                          </p>
                        </div>
                        <StockStatus qty={product.currentStock} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground/40">
            {businessName} · Prices are subject to change
          </p>
        </div>
      </div>
    </div>
  );
}
