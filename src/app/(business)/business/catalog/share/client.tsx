"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, Reorder, useDragControls } from "framer-motion";
import {
  Share2,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
  Calendar,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  Tag,
  Pencil,
  X,
  LayoutGrid,
  GripVertical,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createCatalogueLink,
  toggleCatalogueLink,
  deleteCatalogueLink,
  updateCatalogueExpiry,
  updateLinkCategories,
  type CatalogueShareLink,
} from "@/actions/catalogue-share";
import { type CustomerSegment } from "@/actions/customers";
import { type ProductCategory } from "@/actions/product-catalog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Props {
  links: CatalogueShareLink[];
  segments: CustomerSegment[];
  categories: ProductCategory[];
  businessName: string;
}

function getPublicUrl(token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/c/${token}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ─── Category Picker ──────────────────────────────────────────────────────────

function DraggableCategoryItem({
  category,
  onRemove,
}: {
  category: ProductCategory;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-primary/30 bg-primary/8 text-xs font-medium select-none"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 truncate text-primary">{category.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </Reorder.Item>
  );
}

function CategoryPicker({
  categories,
  selected,
  onChange,
  compact = false,
}: {
  categories: ProductCategory[];
  selected: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}) {
  const selectedCategories = selected
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is ProductCategory => Boolean(c));

  const unselectedCategories = categories.filter((c) => !selected.includes(c.id));

  function addCategory(id: string) {
    onChange([...selected, id]);
  }

  function removeCategory(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  function reorderCategories(newOrder: ProductCategory[]) {
    onChange(newOrder.map((c) => c.id));
  }

  if (categories.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No categories found.</p>
    );
  }

  return (
    <div className="space-y-3">
      {selectedCategories.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <GripVertical className="h-3 w-3" />
            Drag to reorder
          </p>
          <Reorder.Group
            axis="y"
            values={selectedCategories}
            onReorder={reorderCategories}
            className="space-y-1"
          >
            {selectedCategories.map((cat) => (
              <DraggableCategoryItem
                key={cat.id}
                category={cat}
                onRemove={() => removeCategory(cat.id)}
              />
            ))}
          </Reorder.Group>
        </div>
      )}

      {unselectedCategories.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {selectedCategories.length > 0 ? "Add categories" : "Select categories"}
          </p>
          <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
            {unselectedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => addCategory(cat.id)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium border border-border/40 bg-muted/20 text-foreground hover:border-primary/30 hover:bg-primary/5 text-left transition-all"
              >
                <Plus className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[10px] text-muted-foreground">
            {selected.length} of {categories.length} selected
          </p>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Clear (show all)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Link Card ────────────────────────────────────────────────────────────────

function LinkCard({
  link,
  categories,
  onToggle,
  onDelete,
  onUpdateExpiry,
  onUpdateCategories,
}: {
  link: CatalogueShareLink;
  categories: ProductCategory[];
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateExpiry: (id: string, expiresAt: string | null) => Promise<void>;
  onUpdateCategories: (id: string, categoryIds: string[]) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [savingExpiry, setSavingExpiry] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [pendingCategories, setPendingCategories] = useState<string[]>(link.category_ids);
  const [savingCategories, setSavingCategories] = useState(false);

  const expired = isExpired(link.expires_at);
  const effectivelyActive = link.is_active && !expired;

  function copyUrl() {
    navigator.clipboard.writeText(getPublicUrl(link.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggle() {
    setToggling(true);
    await onToggle(link.id, !link.is_active);
    setToggling(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete the link "${link.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(link.id);
  }

  function startEditExpiry() {
    setNewExpiryDate(
      link.expires_at ? new Date(link.expires_at).toISOString().split("T")[0] : ""
    );
    setEditingExpiry(true);
  }

  async function saveExpiry() {
    setSavingExpiry(true);
    const iso = newExpiryDate ? new Date(newExpiryDate).toISOString() : null;
    await onUpdateExpiry(link.id, iso);
    setSavingExpiry(false);
    setEditingExpiry(false);
  }

  async function clearExpiry() {
    setSavingExpiry(true);
    await onUpdateExpiry(link.id, null);
    setSavingExpiry(false);
    setEditingExpiry(false);
  }

  function startEditCategories() {
    setPendingCategories(link.category_ids);
    setEditingCategories(true);
  }

  async function saveCategories() {
    setSavingCategories(true);
    await onUpdateCategories(link.id, pendingCategories);
    setSavingCategories(false);
    setEditingCategories(false);
  }

  const selectedCategoryNames = link.category_ids
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "group rounded-xl border bg-card p-5 space-y-4 transition-all duration-200",
        effectivelyActive
          ? "border-border/50 hover:border-primary/30 hover:shadow-sm"
          : "border-border/25 opacity-60"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm leading-tight truncate">{link.label}</h3>
            {expired ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <AlertCircle className="h-2.5 w-2.5" /> Expired
              </span>
            ) : link.is_active ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border/40">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3 w-3 shrink-0" />
            <span>{link.segment_name}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggle}
            disabled={toggling || expired}
            title={link.is_active ? "Deactivate link" : "Activate link"}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
          >
            {toggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : link.is_active ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete link"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* URL row */}
      <div className="flex items-center gap-2 bg-muted/30 rounded-lg border border-border/40 px-3 py-2">
        <Link2 className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
          /c/{link.token}
        </span>
        <button
          onClick={copyUrl}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={`/c/${link.token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Meta row */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          {link.view_count} view{link.view_count !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Created {formatDate(link.created_at)}
        </span>

        {/* Expiry — inline edit */}
        {editingExpiry ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="h-6 text-xs px-2 py-0 w-32 border-border/50 bg-muted/30"
            />
            <button
              onClick={saveExpiry}
              disabled={savingExpiry}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingExpiry ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </button>
            {link.expires_at && (
              <button
                onClick={clearExpiry}
                disabled={savingExpiry}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setEditingExpiry(false)}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={startEditExpiry}
            className={cn(
              "flex items-center gap-1 group/expiry hover:text-foreground transition-colors",
              expired && "text-amber-600 hover:text-amber-700"
            )}
            title="Edit expiry date"
          >
            {link.expires_at ? (
              <>
                <AlertCircle className="h-3 w-3" />
                {expired ? "Expired" : "Expires"} {formatDate(link.expires_at)}
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3 opacity-50" />
                <span className="opacity-50">No expiry</span>
              </>
            )}
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/expiry:opacity-60 transition-opacity ml-0.5" />
          </button>
        )}
      </div>

      {/* Categories row */}
      {categories.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/30">
          {editingCategories ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <LayoutGrid className="h-3 w-3" />
                Categories to show on this link:
              </p>
              <CategoryPicker
                categories={categories}
                selected={pendingCategories}
                onChange={setPendingCategories}
                compact
              />
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={saveCategories}
                  disabled={savingCategories}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {savingCategories ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                </button>
                <button
                  onClick={() => setEditingCategories(false)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <LayoutGrid className="h-3 w-3 shrink-0" />
                {selectedCategoryNames.length === 0 ? (
                  <span className="italic opacity-60">All categories</span>
                ) : (
                  <span className="truncate">{selectedCategoryNames.join(", ")}</span>
                )}
              </div>
              <button
                onClick={startEditCategories}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/40 hover:bg-primary/5 px-2 py-0.5 rounded transition-all shrink-0"
              >
                <Pencil className="h-2.5 w-2.5" />
                Edit
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

function CreateLinkDialog({
  open,
  onOpenChange,
  segments,
  categories,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  segments: CustomerSegment[];
  categories: ProductCategory[];
  onCreate: (link: CatalogueShareLink) => void;
}) {
  const [label, setLabel] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setLabel("");
    setCustomerName("");
    setSegmentId("");
    setExpiresAt("");
    setSelectedCategories([]);
    setError(null);
  }

  function handleOpenChange(o: boolean) {
    onOpenChange(o);
    if (!o) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const seg = segments.find((s) => s.id === segmentId);
    if (!seg) { setError("Please select a customer segment"); return; }

    setLoading(true);
    const fd = new FormData();
    fd.set("label", label);
    if (customerName.trim()) fd.set("customerName", customerName.trim());
    fd.set("segmentId", segmentId);
    fd.set("segmentName", seg.name);
    if (expiresAt) fd.set("expiresAt", new Date(expiresAt).toISOString());
    for (const cid of selectedCategories) fd.append("categoryIds", cid);

    const res = await createCatalogueLink(fd);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success && res.token && res.id) {
      toast.success("Share link created");
      onCreate({
        id: res.id,
        token: res.token,
        label,
        customer_name: customerName.trim() || null,
        segment_id: segmentId,
        segment_name: seg.name,
        is_active: true,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        view_count: 0,
        created_at: new Date().toISOString(),
        category_ids: selectedCategories,
      });
      handleOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Create Share Link
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="link-label">
              Link Label <span className="text-muted-foreground font-normal">(internal name)</span>
            </Label>
            <Input
              id="link-label"
              placeholder="e.g. Karthik - Chennai B2B"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-muted/30 border-border/50 h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-name">
              Customer Name <span className="text-muted-foreground font-normal">(shown on catalogue page)</span>
            </Label>
            <Input
              id="customer-name"
              placeholder="e.g. Karthik Traders"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-muted/30 border-border/50 h-10"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to show the segment name instead.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Customer Segment</Label>
            {segments.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/40">
                No segments found. Create customer segments first from the Customer Segments page.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                {segments.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setSegmentId(seg.id)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                      segmentId === seg.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 bg-muted/20 text-foreground hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <span>{seg.name}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                      seg.type === "B2B"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : seg.type === "B2C"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border/50"
                    )}>
                      {seg.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <div>
                <Label className="flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Categories to Show
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Leave all unselected to show the full catalogue. Select specific categories to restrict what this link displays.
                </p>
              </div>
              <div className="bg-muted/20 border border-border/40 rounded-lg p-3">
                <CategoryPicker
                  categories={categories}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="link-expires">
              Expiry Date <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="link-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="bg-muted/30 border-border/50 h-10"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for a permanent link.
            </p>
          </div>

          <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || segments.length === 0} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              Create Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export default function ShareClient({ links: initialLinks, segments, categories, businessName }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [links, setLinks] = useState<CatalogueShareLink[]>(initialLinks);
  const [createOpen, setCreateOpen] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleToggle(id: string, active: boolean) {
    const res = await toggleCatalogueLink(id, active);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_active: active } : l))
      );
      toast.success(active ? "Link activated" : "Link deactivated");
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteCatalogueLink(id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Link deleted");
    }
  }

  async function handleUpdateExpiry(id: string, expiresAt: string | null) {
    const res = await updateCatalogueExpiry(id, expiresAt);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, expires_at: expiresAt } : l))
      );
      toast.success(expiresAt ? "Expiry date updated" : "Expiry removed");
    }
  }

  async function handleUpdateCategories(id: string, categoryIds: string[]) {
    const res = await updateLinkCategories(id, categoryIds);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, category_ids: categoryIds } : l))
      );
      toast.success(
        categoryIds.length === 0 ? "Showing all categories" : "Category filter updated"
      );
    }
  }

  function handleCreate(newLink: CatalogueShareLink) {
    setLinks((prev) => [newLink, ...prev]);
  }

  const activeCount = links.filter((l) => l.is_active && !isExpired(l.expires_at)).length;
  const totalViews = links.reduce((s, l) => s + l.view_count, 0);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" />
            Shared Catalogues
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate shareable links for customers with their specific price points.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          New Share Link
        </Button>
      </motion.div>

      {/* Stats */}
      {links.length > 0 && (
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Links", value: links.length, icon: Link2 },
            { label: "Active", value: activeCount, icon: Eye },
            { label: "Total Views", value: totalViews, icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border/40 bg-card px-4 py-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Links list */}
      {links.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-8 py-16 text-center space-y-4"
        >
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-center">
              <Share2 className="h-8 w-8 text-muted-foreground/35" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">No share links yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm mx-auto">
              Create a link for a specific customer segment. They'll see products at their price point — no login needed.
            </p>
          </div>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Create Your First Link
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-3">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              categories={categories}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdateExpiry={handleUpdateExpiry}
              onUpdateCategories={handleUpdateCategories}
            />
          ))}
        </motion.div>
      )}

      {segments.length === 0 && links.length === 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 flex items-start gap-3"
        >
          <Users className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              No customer segments configured
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">
              You need at least one customer segment with pricing configured before creating share links. Go to Customer Segments to set them up.
            </p>
          </div>
        </motion.div>
      )}

      <CreateLinkDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        segments={segments}
        categories={categories}
        onCreate={handleCreate}
      />
    </motion.div>
  );
}
