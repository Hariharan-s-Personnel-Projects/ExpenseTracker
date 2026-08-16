"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Trash2,
  Pencil,
  Settings2,
  ChevronLeft,
  Loader2,
  GripVertical,
  Check,
  X,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  addProduct,
  updateProduct,
  deleteProduct,
  addCostColumn,
  renameCostColumn,
  deleteCostColumn,
  reorderCostColumns,
  type CostColumn,
  type ProductRow,
} from "@/actions/product-catalog";
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

interface Props {
  category: { id: string; name: string; description: string | null };
  costColumns: CostColumn[];
  products: ProductRow[];
  role: "owner" | "admin" | "member";
}

// ─── Product Form (shared by Add + Edit dialogs) ──────────────────────────────

function ProductForm({
  categoryId,
  columns,
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  categoryId: string;
  columns: CostColumn[];
  initial?: ProductRow | null;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [costs, setCosts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const col of columns) {
      map[col.id] = initial?.costs[col.id]?.toString() ?? "0";
    }
    return map;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("categoryId", categoryId);
    if (initial) fd.set("productId", initial.id);
    fd.set("name", name);
    fd.set("description", description);
    for (const col of columns) {
      fd.set(`cost_${col.id}`, costs[col.id] ?? "0");
    }
    onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div className="space-y-2">
          <Label>Product Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Running Shoes"
            required
            className="bg-muted/30 border-border/50 h-10"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short product description (optional)"
            className="bg-muted/30 border-border/50 h-10"
          />
        </div>

        {columns.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Cost Breakdown
            </p>
            <div className="space-y-3">
              {columns.map((col) => (
                <div key={col.id} className="space-y-1">
                  <Label className="text-sm">{col.name}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costs[col.id] ?? "0"}
                      onChange={(e) =>
                        setCosts((prev) => ({
                          ...prev,
                          [col.id]: e.target.value,
                        }))
                      }
                      className="bg-muted/30 border-border/50 h-10 pl-7"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live total preview */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-2">
              <span className="text-sm font-medium">Total Cost</span>
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(
                  columns.reduce(
                    (sum, col) =>
                      sum + (parseFloat(costs[col.id] ?? "0") || 0),
                    0
                  )
                )}
              </span>
            </div>
          </div>
        )}

        {columns.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">
            No cost columns defined yet. Add columns via &quot;Manage
            Columns&quot; first.
          </p>
        )}
      </div>

      <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : initial ? (
            "Save Changes"
          ) : (
            "Add Product"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Manage Columns Dialog ────────────────────────────────────────────────────

function ManageColumnsDialog({
  open,
  onOpenChange,
  categoryId,
  columns,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoryId: string;
  columns: CostColumn[];
  onRefresh: () => void;
}) {
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [localCols, setLocalCols] = useState<CostColumn[]>(columns);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  // Sync when columns prop changes (after refresh)
  if (
    !reordering &&
    localCols.map((c) => c.id).join() !== columns.map((c) => c.id).join()
  ) {
    setLocalCols(columns);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newColName.trim()) return;
    setAddingCol(true);
    const fd = new FormData();
    fd.set("categoryId", categoryId);
    fd.set("name", newColName.trim());
    const res = await addCostColumn(fd);
    setAddingCol(false);
    if (res?.error) toast.error(res.error);
    else {
      setNewColName("");
      toast.success("Column added");
      onRefresh();
    }
  }

  async function handleRename(colId: string) {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    const fd = new FormData();
    fd.set("columnId", colId);
    fd.set("categoryId", categoryId);
    fd.set("name", editingName.trim());
    const res = await renameCostColumn(fd);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Column renamed");
      setEditingId(null);
      onRefresh();
    }
  }

  async function handleDelete(colId: string) {
    if (!confirm("Delete this cost column? All cost data for this column will be lost."))
      return;
    setDeletingId(colId);
    const res = await deleteCostColumn(colId, categoryId);
    setDeletingId(null);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Column deleted");
      onRefresh();
    }
  }

  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    dragOver.current = index;
    if (dragItem.current === null || dragItem.current === index) return;
    const updated = [...localCols];
    const dragged = updated.splice(dragItem.current, 1)[0];
    updated.splice(index, 0, dragged);
    dragItem.current = index;
    setLocalCols(updated);
  }

  async function handleDragEnd() {
    dragItem.current = null;
    dragOver.current = null;
    setReordering(true);
    await reorderCostColumns(
      localCols.map((c) => c.id),
      categoryId
    );
    setReordering(false);
    onRefresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Manage Cost Columns
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing columns list */}
          {localCols.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No cost columns yet. Add one below.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                Drag to reorder
              </p>
              {localCols.map((col, idx) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors group cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

                  {editingId === col.id ? (
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(col.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 text-sm bg-background border-primary/40 flex-1"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium">{col.name}</span>
                  )}

                  <div className="flex gap-1 shrink-0">
                    {editingId === col.id ? (
                      <>
                        <button
                          onClick={() => handleRename(col.id)}
                          className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-muted-foreground hover:bg-muted/50 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(col.id);
                            setEditingName(col.name);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Rename"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(col.id)}
                          disabled={deletingId === col.id}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                          title="Delete column"
                        >
                          {deletingId === col.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new column */}
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              Add new column
            </p>
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. Packaging Cost, Shipping Cost"
                className="bg-muted/30 border-border/50 h-9 flex-1 text-sm"
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={addingCol}
                className="gap-1.5 shrink-0"
              >
                {addingCol ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="h-3.5 w-3.5" />
                )}
                Add
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-3 bg-muted/50 rounded-b-xl border-t flex flex-row justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function CategoryClient({
  category,
  costColumns,
  products,
  role,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = role === "owner" || role === "admin";

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAddProduct(fd: FormData) {
    setFormLoading(true);
    const res = await addProduct(fd);
    setFormLoading(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Product added");
      setAddOpen(false);
      refresh();
    }
  }

  async function handleEditProduct(fd: FormData) {
    setFormLoading(true);
    const res = await updateProduct(fd);
    setFormLoading(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Product updated");
      setEditProduct(null);
      refresh();
    }
  }

  async function handleDeleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await deleteProduct(id, category.id);
    setDeletingId(null);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Product deleted");
      refresh();
    }
  }

  // Compute column totals
  const colTotals: Record<string, number> = {};
  for (const col of costColumns) {
    colTotals[col.id] = products.reduce(
      (sum, p) => sum + (p.costs[col.id] ?? 0),
      0
    );
  }
  const grandTotal = products.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      {/* Breadcrumb + Header */}
      <motion.div variants={fadeUp} className="space-y-3">
        <Link
          href="/business/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Product Catalog
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              {category.name}
            </h1>
            {category.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {category.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setManageColumnsOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
                Manage Columns
              </Button>
            )}
            <Button
              size="sm"
              className="gap-2 shadow-sm hover:shadow-md active:scale-[0.97]"
              onClick={() => setAddOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Product Table */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <Package className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No products yet in this category.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 mt-1"
                  onClick={() => setAddOpen(true)}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add first product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {/* Row 1: group headers */}
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th
                        className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                        rowSpan={costColumns.length > 0 ? 1 : 1}
                      >
                        #
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Product Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Description
                      </th>

                      {/* Cost breakdown header spanning all cost columns */}
                      {costColumns.length > 0 && (
                        <th
                          colSpan={costColumns.length}
                          className="text-center px-4 py-3 text-xs font-semibold text-primary/70 uppercase tracking-wide border-l border-border/30"
                        >
                          Cost Breakdown
                        </th>
                      )}

                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-l border-border/30 whitespace-nowrap">
                        Total Cost
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>

                    {/* Row 2: individual cost column names */}
                    {costColumns.length > 0 && (
                      <tr className="border-b border-border/30 bg-muted/10">
                        <th />
                        <th />
                        <th />
                        {costColumns.map((col) => (
                          <th
                            key={col.id}
                            className="text-right px-4 py-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide border-l border-border/20 whitespace-nowrap"
                          >
                            {col.name}
                          </th>
                        ))}
                        <th className="border-l border-border/20" />
                        <th />
                      </tr>
                    )}
                  </thead>

                  <tbody className="divide-y divide-border/30">
                    {products.map((product, idx) => (
                      <tr
                        key={product.id}
                        className="hover:bg-muted/15 transition-colors"
                      >
                        <td className="px-5 py-3 text-muted-foreground text-xs font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{product.name}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                          <p className="truncate">{product.description || "—"}</p>
                        </td>

                        {costColumns.map((col) => (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-right whitespace-nowrap border-l border-border/20"
                          >
                            {product.costs[col.id] != null
                              ? formatCurrency(product.costs[col.id])
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                        ))}

                        <td className="px-4 py-3 text-right font-semibold whitespace-nowrap border-l border-border/30 text-primary">
                          {formatCurrency(product.totalCost)}
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditProduct(product)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                              title="Edit product"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProduct(product.id, product.name)
                              }
                              disabled={deletingId === product.id}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                              title="Delete product"
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Footer: column totals */}
                  {products.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-border/50 bg-muted/20">
                        <td
                          colSpan={3}
                          className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                        >
                          Column Totals
                        </td>
                        {costColumns.map((col) => (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-right font-semibold whitespace-nowrap border-l border-border/20 text-sm"
                          >
                            {formatCurrency(colTotals[col.id] ?? 0)}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap border-l border-border/30 text-base text-primary">
                          {formatCurrency(grandTotal)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile product cards */}
      {products.length > 0 && (
        <motion.div variants={fadeUp} className="md:hidden space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Products (mobile view)
          </p>
          {products.map((product) => (
            <Card key={product.id} className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditProduct(product)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteProduct(product.id, product.name)
                      }
                      disabled={deletingId === product.id}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {costColumns.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-border/30">
                    {costColumns.map((col) => (
                      <div
                        key={col.id}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-muted-foreground">{col.name}</span>
                        <span className="font-medium">
                          {formatCurrency(product.costs[col.id] ?? 0)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1 border-t border-border/20 font-semibold">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatCurrency(product.totalCost)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              Add Product
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            categoryId={category.id}
            columns={costColumns}
            onSubmit={handleAddProduct}
            onCancel={() => setAddOpen(false)}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={!!editProduct}
        onOpenChange={(o) => !o && setEditProduct(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Edit Product
            </DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              categoryId={category.id}
              columns={costColumns}
              initial={editProduct}
              onSubmit={handleEditProduct}
              onCancel={() => setEditProduct(null)}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Columns Dialog */}
      <ManageColumnsDialog
        open={manageColumnsOpen}
        onOpenChange={setManageColumnsOpen}
        categoryId={category.id}
        columns={costColumns}
        onRefresh={refresh}
      />
    </motion.div>
  );
}
