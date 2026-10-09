"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Sparkles,
  Tag,
  Layers,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Send,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import type { PublicCatalogueData, PublicContactInfo } from "@/actions/catalogue-share";
import type { SalesProduct } from "@/actions/sales";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

// ─── Cart Types ───────────────────────────────────────────────────────────────

interface CartItem {
  product: SalesProduct;
  quantity: number;
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────

function CartDrawer({
  open,
  onClose,
  items,
  onQuantityChange,
  onRemove,
  businessName,
  contact,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onQuantityChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  businessName: string;
  contact: PublicContactInfo;
}) {
  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);

  function buildWhatsAppMessage() {
    const lines = [
      `Hi ${businessName}! I'd like to order the following:`,
      "",
      ...items.flatMap((i) => {
        const itemLine = `• ${i.product.name} × ${i.quantity} = ${formatCurrency(i.product.sellingPrice * i.quantity)}`;
        const img = i.product.images?.[0]?.url;
        return img ? [itemLine, img] : [itemLine];
      }),
      "",
      `Total: ${formatCurrency(subtotal)}`,
    ];
    return lines.join("\n");
  }

  function buildEmailBody() {
    const lines = [
      `Hi ${businessName},`,
      "",
      `I'd like to place an order for the following items:`,
      "",
      ...items.flatMap((i) => {
        const itemLine = `• ${i.product.name} × ${i.quantity} = ${formatCurrency(i.product.sellingPrice * i.quantity)}`;
        const img = i.product.images?.[0]?.url;
        return img ? [itemLine, `  Product image: ${img}`, ""] : [itemLine, ""];
      }),
      `Total: ${formatCurrency(subtotal)}`,
      "",
      `Please confirm availability and payment details.`,
      "",
      `Thank you!`,
    ];
    return lines.join("\n");
  }

  function buildPlainMessage() {
    const lines = [
      `Hi ${businessName}! I'd like to order the following:`,
      "",
      ...items.map(
        (i) => `• ${i.product.name} × ${i.quantity} = ${formatCurrency(i.product.sellingPrice * i.quantity)}`
      ),
      "",
      `Total: ${formatCurrency(subtotal)}`,
    ];
    return lines.join("\n");
  }

  function handleWhatsApp() {
    const phone = contact.phone?.replace(/\D/g, "");
    const msg = encodeURIComponent(buildWhatsAppMessage());
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Order Enquiry — ${businessName}`);
    const body = encodeURIComponent(buildEmailBody());
    window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, "_blank");
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildPlainMessage());
  }

  const hasPhone = !!contact.phone;
  const hasEmail = !!contact.email;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/30">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Your Order
            <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted/50 border border-border/40 px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/25" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground/50">Tap the shop button on any product to add it here.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
                  {item.product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="h-14 w-14 rounded-lg object-cover border border-border/30 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted/30 border border-border/20 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold leading-snug line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground/60">{formatCurrency(item.product.sellingPrice)} each</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-sm font-bold text-primary tabular-nums">
                      {formatCurrency(item.product.sellingPrice * item.quantity)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => item.quantity <= 1 ? onRemove(item.product.id) : onQuantityChange(item.product.id, item.quantity - 1)}
                        className="h-6 w-6 rounded-md bg-muted/60 hover:bg-muted border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.quantity <= 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => onQuantityChange(item.product.id, item.quantity + 1)}
                        className="h-6 w-6 rounded-md bg-muted/60 hover:bg-muted border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-6 pt-4 border-t border-border/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Subtotal</span>
                <span className="text-xl font-extrabold text-primary tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/50 -mt-2">
                Final price may vary · Contact the business to confirm availability
              </p>
              <div className="space-y-2">
                {hasPhone && (
                  <Button onClick={handleWhatsApp} className="w-full gap-2 bg-[#25D366] hover:bg-[#1ebe59] text-white border-0">
                    <MessageCircle className="h-4 w-4" />
                    Send via WhatsApp
                  </Button>
                )}
                {hasEmail && (
                  <Button onClick={handleEmail} variant="outline" className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    Send via Email
                  </Button>
                )}
                {!hasPhone && !hasEmail && (
                  <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Copy Order Summary
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
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
  onAddToCart,
  cartQty = 0,
  staggerIndex = 0,
  showStock = true,
}: {
  product: SalesProduct;
  onSelect: (p: SalesProduct) => void;
  onAddToCart: (p: SalesProduct) => void;
  cartQty?: number;
  staggerIndex?: number;
  showStock?: boolean;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOutOfStock = showStock && product.currentStock === 0;
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
      <div className="relative aspect-[3/4] overflow-hidden bg-muted/20 flex-shrink-0 flex items-center justify-center">
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
              className="absolute inset-0 w-full h-full object-contain"
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none" />
        {showStock && (
          <div className="absolute top-2.5 left-2.5">
            <StockBadge qty={product.currentStock} />
          </div>
        )}

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
          {!isOutOfStock ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className={cn(
                "relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 shrink-0",
                cartQty > 0
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "bg-muted/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground border border-border/40"
              )}
              title="Add to cart"
            >
              <ShoppingBag className="h-3 w-3" />
              {cartQty > 0 ? `${cartQty} in cart` : "Shop"}
            </button>
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/50 border border-border/30 px-2 py-0.5 rounded-full truncate max-w-[90px]">
              {product.categoryName}
            </span>
          )}
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
  onAddToCart,
  cartQty = 0,
  showStock = true,
}: {
  product: SalesProduct | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (p: SalesProduct) => void;
  cartQty?: number;
  showStock?: boolean;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => { if (open) setImgIdx(0); }, [open, product?.id]);

  // Push a history entry when the modal opens so the mobile back button closes
  // it instead of navigating away from the page.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ catalogModal: true }, "");
    const handlePop = () => onClose();
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
      // If closed by the button (not back), clean up the extra history entry.
      if (window.history.state?.catalogModal) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  if (!product) return null;

  const images = product.images ?? [];
  const currentImage = images[imgIdx];
  const hasManyImages = images.length > 1;

  function prev() { setImgIdx((i) => (i - 1 + images.length) % images.length); }
  function next() { setImgIdx((i) => (i + 1) % images.length); }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full max-w-lg sm:max-w-2xl p-0 overflow-hidden rounded-2xl border-border/50 gap-0 max-h-[92dvh] flex flex-col">
        <div className="relative bg-muted/20 overflow-hidden flex items-center justify-center flex-shrink-0" style={{ maxHeight: "55vh", minHeight: "180px" }}>
          <AnimatePresence mode="wait">
            {currentImage ? (
              <motion.img
                key={currentImage.id}
                src={currentImage.url}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full object-contain"
                style={{ maxHeight: "55vh" }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/3">
                <Package className="h-20 w-20 text-primary/20" />
              </div>
            )}
          </AnimatePresence>
          {hasManyImages && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition-colors backdrop-blur-sm">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition-colors backdrop-blur-sm">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm tabular-nums">
                {imgIdx + 1} / {images.length}
              </div>
            </>
          )}
          {showStock && (
            <div className="absolute top-3 left-3">
              <StockBadge qty={product.currentStock} />
            </div>
          )}
        </div>

        {hasManyImages && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <button key={img.id} onClick={() => setImgIdx(i)} className={cn("flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all duration-200", i === imgIdx ? "border-primary shadow-sm shadow-primary/25 opacity-100" : "border-transparent opacity-55 hover:opacity-90")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-bold text-primary/70 uppercase tracking-widest">{product.categoryName}</span>
            <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
            {product.description && <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{product.description}</p>}
          </div>
          <div className="flex items-end justify-between pt-3 border-t border-border/30 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground/55 font-medium uppercase tracking-widest mb-0.5">Price</p>
              <p className="text-3xl font-extrabold text-primary tabular-nums leading-tight">{formatCurrency(product.sellingPrice)}</p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">Incl. all taxes</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {showStock && <StockBadge qty={product.currentStock} size="lg" />}
              {(!showStock || product.currentStock > 0) && (
                <button
                  onClick={() => onAddToCart(product)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                    cartQty > 0
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30"
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {cartQty > 0 ? `${cartQty} in cart · Add more` : "Add to Cart"}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contact Section ──────────────────────────────────────────────────────────

function hasContactInfo(c: PublicContactInfo) {
  return Object.values(c).some((v) => v !== null && v !== "");
}

function ContactSection({ contact, businessName, logoUrl }: { contact: PublicContactInfo; businessName: string; logoUrl: string | null }) {
  if (!hasContactInfo(contact)) return null;

  const hasAddress = contact.address_line1 || contact.city || contact.state || contact.country;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-16 pt-10 border-t border-border/30"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary/70" />
          <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-foreground/75">
            Contact Us
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
      </div>

      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {/* Business name header */}
        <div className="px-6 py-5 bg-gradient-to-r from-primary/8 to-transparent border-b border-border/30">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={businessName}
                width={44}
                height={44}
                className="rounded-xl object-cover border border-border/50 shrink-0"
              />
            ) : (
              <div className="bg-primary/15 border border-primary/25 p-2.5 rounded-xl shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <p className="font-bold text-base">{businessName}</p>
              <p className="text-xs text-muted-foreground">Get in touch to place your order</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold truncate">{contact.phone}</p>
                </div>
              </a>
            )}

            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold truncate">{contact.email}</p>
                </div>
              </a>
            )}

            {contact.website && (
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Website</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold truncate">{contact.website.replace(/^https?:\/\//, "")}</p>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  </div>
                </div>
              </a>
            )}

            {hasAddress && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 sm:col-span-1">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mb-0.5">Address</p>
                  <div className="text-sm font-medium space-y-0.5 text-foreground/80">
                    {contact.address_line1 && <p>{contact.address_line1}</p>}
                    {contact.address_line2 && <p>{contact.address_line2}</p>}
                    {(contact.city || contact.state || contact.postal_code) && (
                      <p>
                        {[contact.city, contact.state, contact.postal_code].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {contact.country && <p>{contact.country}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
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

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  data: PublicCatalogueData;
}

export default function PublicCatalogueClient({ data }: Props) {
  const { businessName, industry, logoUrl, brandColor, contact, segmentName, customerName, showStock, products, categoryOrder } = data;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<SalesProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = useCallback((product: SalesProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const cartTotalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const getCartQty = (productId: string) => cart.find((i) => i.product.id === productId)?.quantity ?? 0;

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      if (!seen.has(p.categoryId)) seen.set(p.categoryId, p.categoryName);
    }
    const orderIndex = new Map(categoryOrder.map((id, i) => [id, i]));
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => {
        const ia = orderIndex.has(a.id) ? orderIndex.get(a.id)! : Infinity;
        const ib = orderIndex.has(b.id) ? orderIndex.get(b.id)! : Infinity;
        return ia - ib;
      });
  }, [products, categoryOrder]);

  const displayProducts = useMemo(() => {
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
    if (categoryOrder.length > 0) {
      const orderIndex = new Map(categoryOrder.map((id, i) => [id, i]));
      return new Map(
        [...map.entries()].sort(([a], [b]) => {
          const ia = orderIndex.has(a) ? orderIndex.get(a)! : Infinity;
          const ib = orderIndex.has(b) ? orderIndex.get(b)! : Infinity;
          return ia - ib;
        })
      );
    }
    return map;
  }, [displayProducts, categoryOrder]);

  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.currentStock > 0).length;
  const isSearching = !!searchQuery.trim();

  return (
    <div
      className="min-h-screen bg-background"
      style={brandColor ? ({ "--primary": brandColor } as React.CSSProperties) : undefined}
    >
      {/* Floating cart button */}
      {cartTotalItems > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-2xl shadow-primary/40 font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          <ShoppingBag className="h-4 w-4" />
          {cartTotalItems} item{cartTotalItems !== 1 ? "s" : ""}
          <span className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-extrabold">
            {cart.length}
          </span>
        </motion.button>
      )}
      {/* Thin top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/60" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-0">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/12 via-primary/5 to-transparent border border-primary/10 px-6 py-10 sm:py-16 mb-8">
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
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={businessName}
                  width={64}
                  height={64}
                  className="rounded-2xl object-cover border border-border/50 shadow-xl shrink-0"
                />
              ) : (
                <div className="bg-primary/15 border border-primary/25 p-3.5 rounded-2xl shadow-xl shadow-primary/15">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                {businessName}
              </h1>
            </motion.div>

            {industry && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-xs font-semibold text-primary/60 uppercase tracking-widest"
              >
                {industry}
              </motion.p>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed"
            >
              Explore our curated collection — prices shown for{" "}
              <span className="font-semibold text-foreground">{customerName ?? segmentName}</span>
            </motion.p>

            {totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                {showStock && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/12 border border-emerald-500/25 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {inStockCount} in stock
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Filter + Search ── */}
        {totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="flex flex-wrap items-center gap-2 pb-6"
          >
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
            <div className="relative shrink-0 w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/55 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-8 pr-8 py-2 rounded-full text-xs bg-muted/40 border border-border/40 focus:border-primary/50 focus:bg-background focus:outline-none transition-all placeholder:text-muted-foreground/45"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/55 hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Catalogue content ── */}
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-muted/30 border border-border/20 flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/25" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-muted-foreground">No products available yet</p>
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
              <p className="text-sm text-muted-foreground/50">Try a different keyword or clear the filters.</p>
            </div>
            <button onClick={() => { setSearchQuery(""); setActiveCategoryId(null); }} className="text-sm font-medium text-primary hover:underline underline-offset-2 transition-all">
              Clear filters
            </button>
          </div>
        ) : isSearching ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{displayProducts.length}</span>{" "}
              result{displayProducts.length !== 1 ? "s" : ""} for{" "}
              <span className="font-semibold text-foreground">"{searchQuery}"</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} onSelect={setModalProduct} onAddToCart={addToCart} cartQty={getCartQty(p.id)} staggerIndex={i} showStock={showStock} />
              ))}
            </div>
          </motion.div>
        ) : (
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
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                      <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-foreground/75">{categoryName}</h2>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
                    {showStock && (
                      <span className="text-[11px] font-medium text-muted-foreground/50 shrink-0 tabular-nums">
                        {available}/{items.length} available
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((product, idx) => (
                      <ProductCard key={product.id} product={product} onSelect={setModalProduct} onAddToCart={addToCart} cartQty={getCartQty(product.id)} staggerIndex={idx} showStock={showStock} />
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}

        {/* ── Contact section ── */}
        <ContactSection contact={contact} businessName={businessName} logoUrl={logoUrl} />

        {/* ── Footer ── */}
        <div className="pt-12 pb-6 border-t border-border/20 mt-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/35">
              {businessName} · All prices include applicable taxes · Subject to availability
            </p>
            <p className="text-xs text-muted-foreground/25">
              Powered by Tracker AI
            </p>
          </div>
        </div>
      </div>

      <ProductModal
        product={modalProduct}
        open={!!modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={addToCart}
        cartQty={modalProduct ? getCartQty(modalProduct.id) : 0}
        showStock={showStock}
      />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onQuantityChange={updateQty}
        onRemove={removeFromCart}
        businessName={businessName}
        contact={contact}
      />
    </div>
  );
}
