"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Package,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Sparkles,
  Tag,
  Layers,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { getSalesProducts, type SalesProduct } from "@/actions/sales";
import { type CustomerSegment } from "@/actions/customers";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

// ─── Stock Badge ──────────────────────────────────────────────────────────────

function StockBadge({ qty, size = "sm" }: { qty: number; size?: "sm" | "lg" }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-full";
  const sz = size === "lg" ? "px-3.5 py-1 text-sm" : "px-2.5 py-0.5 text-[10px]";

  if (qty === 0)
    return (
      <span className={cn(base, sz, "bg-red-500/12 text-red-600 dark:text-red-400 border border-red-500/20")}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
        Out of Stock
      </span>
    );
  if (qty <= 10)
    return (
      <span className={cn(base, sz, "bg-amber-500/12 text-amber-700 dark:text-amber-400 border border-amber-500/20")}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
        Limited Stock
      </span>
    );
  return (
    <span className={cn(base, sz, "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20")}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      In Stock
    </span>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onSelect,
  staggerIndex = 0,
}: {
  product: SalesProduct;
  onSelect: (p: SalesProduct) => void;
  staggerIndex?: number;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOutOfStock = product.currentStock === 0;
  const images = product.images ?? [];
  const currentImage = images[imgIdx];

  useEffect(() => {
    if (hovered && images.length > 1) {
      timerRef.current = setInterval(() => {
        setImgIdx((p) => (p + 1) % images.length);
      }, 1600);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!hovered) setImgIdx(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hovered, images.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: staggerIndex * 0.055 }}
      onClick={() => !isOutOfStock && onSelect(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden bg-card border transition-all duration-300",
        isOutOfStock
          ? "opacity-55 border-border/20 cursor-default"
          : "border-border/40 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 cursor-pointer"
      )}
    >
      {/* ── Image area ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/20 flex-shrink-0">
        <AnimatePresence mode="wait">
          {currentImage ? (
            <motion.img
              key={currentImage.id}
              src={currentImage.url}
              alt={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-700",
                hovered && !isOutOfStock && "scale-105"
              )}
            />
          ) : (
            <motion.div
              key="placeholder"
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/8 via-primary/4 to-transparent"
            >
              <Package className="h-11 w-11 text-primary/25" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none" />

        {/* Stock badge */}
        <div className="absolute top-2.5 left-2.5">
          <StockBadge qty={product.currentStock} />
        </div>

        {/* Image dot indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "block rounded-full bg-white transition-all duration-300",
                  i === imgIdx ? "w-4 h-1.5 shadow" : "w-1.5 h-1.5 opacity-50"
                )}
              />
            ))}
          </div>
        )}

        {/* Hover overlay — slides up from bottom */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none">
            <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pt-8 pb-3.5 flex items-end justify-between gap-2">
              <span className="text-white text-[11px] font-semibold leading-snug line-clamp-1 opacity-90">
                {product.name}
              </span>
              <span className="shrink-0 bg-white/95 text-foreground text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
                View
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/20">
          <p className="text-xl font-bold text-primary tabular-nums leading-tight">
            {formatCurrency(product.sellingPrice)}
          </p>
          <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/50 border border-border/30 px-2 py-0.5 rounded-full truncate max-w-[90px]">
            {product.categoryName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────

function ProductModal({
  product,
  open,
  onClose,
}: {
  product: SalesProduct | null;
  open: boolean;
  onClose: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (open) setImgIdx(0);
  }, [open, product?.id]);

  if (!product) return null;

  const images = product.images ?? [];
  const currentImage = images[imgIdx];
  const hasManyImages = images.length > 1;

  function prev() { setImgIdx((i) => (i - 1 + images.length) % images.length); }
  function next() { setImgIdx((i) => (i + 1) % images.length); }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border-border/50 gap-0">
        {/* Main image */}
        <div className="relative bg-muted/20 overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <AnimatePresence mode="wait">
            {currentImage ? (
              <motion.img
                key={currentImage.id}
                src={currentImage.url}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/3">
                <Package className="h-20 w-20 text-primary/20" />
              </div>
            )}
          </AnimatePresence>

          {/* Nav arrows */}
          {hasManyImages && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm tabular-nums">
                {imgIdx + 1} / {images.length}
              </div>
            </>
          )}

          {/* Stock badge overlay */}
          <div className="absolute top-3 left-3">
            <StockBadge qty={product.currentStock} />
          </div>
        </div>

        {/* Thumbnail strip */}
        {hasManyImages && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setImgIdx(i)}
                className={cn(
                  "flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all duration-200",
                  i === imgIdx
                    ? "border-primary shadow-sm shadow-primary/25 opacity-100"
                    : "border-transparent opacity-55 hover:opacity-90"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-bold text-primary/70 uppercase tracking-widest">
              {product.categoryName}
            </span>
            <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/30 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground/55 font-medium uppercase tracking-widest mb-0.5">
                Price
              </p>
              <p className="text-3xl font-extrabold text-primary tabular-nums leading-tight">
                {formatCurrency(product.sellingPrice)}
              </p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Incl. all taxes
              </p>
            </div>
            <StockBadge qty={product.currentStock} size="lg" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/20 bg-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted/40" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-3.5 w-4/5 rounded-full bg-muted/50" />
          <div className="h-3 w-3/5 rounded-full bg-muted/35" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/15">
          <div className="h-6 w-24 rounded-lg bg-muted/50" />
          <div className="h-4 w-16 rounded-full bg-muted/35" />
        </div>
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-12">
      {[4, 3].map((count, si) => (
        <section key={si} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-32 rounded-full bg-muted/45 animate-pulse" />
            <div className="flex-1 h-px bg-border/25" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  businessName: string;
  segments: CustomerSegment[];
}

export default function CatalogDisplayClient({ businessName, segments }: Props) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [products, setProducts] = useState<SalesProduct[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<SalesProduct | null>(null);

  async function handleSegmentChange(segmentId: string) {
    if (segmentId === selectedSegmentId) return;
    setSelectedSegmentId(segmentId);
    setLoading(true);
    setActiveCategoryId(null);
    setSearchQuery("");
    const data = await getSalesProducts(segmentId);
    setProducts(data);
    setLoading(false);
  }

  const hasData = products !== null;

  const categories = useMemo(() => {
    if (!products) return [];
    const seen = new Map<string, string>();
    for (const p of products) {
      if (!seen.has(p.categoryId)) seen.set(p.categoryId, p.categoryName);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const displayProducts = useMemo(() => {
    if (!products) return [];
    let list = products;
    if (activeCategoryId) list = list.filter((p) => p.categoryId === activeCategoryId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategoryId, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, { categoryName: string; items: SalesProduct[] }>();
    for (const p of displayProducts) {
      if (!map.has(p.categoryId))
        map.set(p.categoryId, { categoryName: p.categoryName, items: [] });
      map.get(p.categoryId)!.items.push(p);
    }
    return map;
  }, [displayProducts]);

  const totalCount = (products ?? []).length;
  const inStockCount = (products ?? []).filter((p) => p.currentStock > 0).length;
  const isSearching = !!searchQuery.trim();

  return (
    <div className="relative space-y-0">
      {/* ── Staff-only segment selector ── */}
      {segments.length > 0 && (
        <div className="fixed top-3 right-4 z-50">
          <div className="opacity-20 hover:opacity-90 focus-within:opacity-90 transition-opacity duration-300">
            <div className="flex items-center gap-1.5 bg-muted/70 backdrop-blur-sm border border-border/30 rounded-lg px-2.5 py-1.5 shadow-sm">
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
                    <option key={seg.id} value={seg.id}>{seg.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/12 via-primary/5 to-transparent border border-primary/10 px-6 py-10 sm:py-14 mb-8">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-primary/4 blur-3xl pointer-events-none" />

        <div className="relative text-center space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="bg-primary/15 border border-primary/25 p-3.5 rounded-2xl shadow-xl shadow-primary/15">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {businessName}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed"
          >
            {hasData && !loading
              ? "Discover our curated collection of quality products"
              : "Browse our exclusive product catalog"}
          </motion.p>

          <AnimatePresence>
            {hasData && !loading && totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.28 }}
                className="flex flex-wrap items-center justify-center gap-2.5 pt-1"
              >
                <div className="flex items-center gap-1.5 bg-background/70 backdrop-blur-sm border border-border/40 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  {categories.length} {categories.length === 1 ? "category" : "categories"}
                </div>
                <div className="flex items-center gap-1.5 bg-background/70 backdrop-blur-sm border border-border/40 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  {totalCount} products
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/12 border border-emerald-500/25 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {inStockCount} in stock
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Filter + Search Bar ── */}
      {hasData && !loading && totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="flex flex-wrap items-center gap-2 pb-6"
        >
          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200",
                !activeCategoryId
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
              )}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id === activeCategoryId ? null : cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 whitespace-nowrap",
                  activeCategoryId === cat.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative shrink-0 w-44 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/55 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-8 pr-8 py-2 rounded-full text-xs bg-muted/40 border border-border/40 focus:border-primary/50 focus:bg-background focus:outline-none transition-all placeholder:text-muted-foreground/45"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/55 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Catalog content ── */}
      {loading ? (
        <CatalogSkeleton />
      ) : !hasData ? (
        <CatalogSkeleton />
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-muted/30 border border-border/20 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/25" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-muted-foreground">No products available</p>
            <p className="text-sm text-muted-foreground/50">Check back soon for new arrivals.</p>
          </div>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground/25" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground/50">
              Try a different keyword or clear the filters.
            </p>
          </div>
          <button
            onClick={() => { setSearchQuery(""); setActiveCategoryId(null); }}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 transition-all"
          >
            Clear filters
          </button>
        </div>
      ) : isSearching ? (
        /* ── Flat search results ── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{displayProducts.length}</span>{" "}
            result{displayProducts.length !== 1 ? "s" : ""} for{" "}
            <span className="font-semibold text-foreground">"{searchQuery}"</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} onSelect={setModalProduct} staggerIndex={i} />
            ))}
          </div>
        </motion.div>
      ) : (
        /* ── Grouped by category ── */
        <div className="space-y-14">
          {Array.from(grouped.entries()).map(([catId, { categoryName, items }]) => {
            const available = items.filter((p) => p.currentStock > 0).length;
            return (
              <motion.section
                key={catId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-foreground/75">
                      {categoryName}
                    </h2>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
                  <span className="text-[11px] font-medium text-muted-foreground/50 shrink-0 tabular-nums">
                    {available}/{items.length} available
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setModalProduct}
                      staggerIndex={idx}
                    />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      {hasData && (
        <div className="pt-12 pb-4 border-t border-border/20 mt-10 text-center">
          <p className="text-xs text-muted-foreground/35">
            {businessName} · All prices include applicable taxes · Subject to availability
          </p>
        </div>
      )}

      {/* ── Product modal ── */}
      <ProductModal
        product={modalProduct}
        open={!!modalProduct}
        onClose={() => setModalProduct(null)}
      />
    </div>
  );
}
