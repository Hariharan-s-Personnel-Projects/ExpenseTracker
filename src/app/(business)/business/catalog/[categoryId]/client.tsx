"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Trash2,
  Pencil,
  Settings2,
  ChevronLeft,
  Loader2,
  GripVertical,
  Check,
  X,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface EditableRow {
  id: string;
  name: string;
  description: string;
  costs: Record<string, string>;
}

interface NewRowData {
  name: string;
  description: string;
  costs: Record<string, string>;
}

function toEditableRow(p: ProductRow, cols: CostColumn[]): EditableRow {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    costs: Object.fromEntries(
      cols.map((col) => [col.id, (p.costs[col.id] ?? 0).toString()])
    ),
  };
}

function computeTotal(costs: Record<string, string>, cols: CostColumn[]): number {
  return cols.reduce(
    (sum, col) => sum + (parseFloat(costs[col.id] ?? "0") || 0),
    0
  );
}

function emptyNewRow(cols: CostColumn[]): NewRowData {
  return {
    name: "",
    description: "",
    costs: Object.fromEntries(cols.map((col) => [col.id, ""])),
  };
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
    if (!editingName.trim()) { setEditingId(null); return; }
    const fd = new FormData();
    fd.set("columnId", colId);
    fd.set("categoryId", categoryId);
    fd.set("name", editingName.trim());
    const res = await renameCostColumn(fd);
    if (res?.error) toast.error(res.error);
    else { toast.success("Column renamed"); setEditingId(null); onRefresh(); }
  }

  async function handleDelete(colId: string) {
    if (!confirm("Delete this cost column? All cost data for this column will be lost.")) return;
    setDeletingId(colId);
    const res = await deleteCostColumn(colId, categoryId);
    setDeletingId(null);
    if (res?.error) toast.error(res.error);
    else { toast.success("Column deleted"); onRefresh(); }
  }

  function handleDragStart(index: number) { dragItem.current = index; }

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
    await reorderCostColumns(localCols.map((c) => c.id), categoryId);
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
                        <button onClick={() => handleRename(col.id)} className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 transition-colors" title="Save">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 rounded text-muted-foreground hover:bg-muted/50 transition-colors" title="Cancel">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(col.id); setEditingName(col.name); }}
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
              <Button type="submit" size="sm" disabled={addingCol} className="gap-1.5 shrink-0">
                {addingCol ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                Add
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-3 bg-muted/50 rounded-b-xl border-t flex flex-row justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function CategoryClient({ category, costColumns, products, role }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<EditableRow[]>(() =>
    products.map((p) => toEditableRow(p, costColumns))
  );
  const [newRow, setNewRow] = useState<NewRowData>(() => emptyNewRow(costColumns));
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savingNewRow, setSavingNewRow] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);

  const savedRef = useRef<Record<string, EditableRow>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const canManage = role === "owner" || role === "admin";
  // 0=name, 1=description, 2..N+1=cost cols
  const totalCols = 2 + costColumns.length;

  // Sync when products/columns refresh from server
  useEffect(() => {
    const synced = products.map((p) => toEditableRow(p, costColumns));
    setRows(synced);
    savedRef.current = Object.fromEntries(
      synced.map((r) => [r.id, { ...r, costs: { ...r.costs } }])
    );
    setNewRow(emptyNewRow(costColumns));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, costColumns]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function saveRow(rowId: string) {
    const row = rows.find((r) => r.id === rowId);
    if (!row || !row.name.trim()) return;

    const saved = savedRef.current[rowId];
    const isDirty =
      !saved ||
      saved.name !== row.name ||
      saved.description !== row.description ||
      costColumns.some((col) => saved.costs[col.id] !== row.costs[col.id]);
    if (!isDirty) return;

    setSavingIds((prev) => new Set(prev).add(rowId));
    const fd = new FormData();
    fd.set("productId", rowId);
    fd.set("categoryId", category.id);
    fd.set("name", row.name);
    fd.set("description", row.description);
    for (const col of costColumns) fd.set(`cost_${col.id}`, row.costs[col.id] || "0");
    const res = await updateProduct(fd);
    setSavingIds((prev) => { const s = new Set(prev); s.delete(rowId); return s; });
    if (res?.error) {
      toast.error(res.error);
      if (saved) setRows((prev) => prev.map((r) => r.id === rowId ? { ...saved, costs: { ...saved.costs } } : r));
    } else {
      savedRef.current[rowId] = { ...row, costs: { ...row.costs } };
    }
  }

  async function saveNewRow() {
    if (!newRow.name.trim()) return;
    setSavingNewRow(true);
    const fd = new FormData();
    fd.set("categoryId", category.id);
    fd.set("name", newRow.name);
    fd.set("description", newRow.description);
    for (const col of costColumns) fd.set(`cost_${col.id}`, newRow.costs[col.id] || "0");
    const res = await addProduct(fd);
    setSavingNewRow(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setNewRow(emptyNewRow(costColumns));
      refresh();
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await deleteProduct(id, category.id);
    setDeletingId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Product deleted");
      setRows((prev) => prev.filter((r) => r.id !== id));
      refresh();
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number
  ) {
    if (e.key === "Tab") {
      let nextRef: HTMLInputElement | null | undefined;
      if (e.shiftKey) {
        if (colIdx > 0) nextRef = inputRefs.current[`${rowIdx}-${colIdx - 1}`];
        else if (rowIdx > 0) nextRef = inputRefs.current[`${rowIdx - 1}-${totalCols - 1}`];
      } else {
        if (colIdx < totalCols - 1) nextRef = inputRefs.current[`${rowIdx}-${colIdx + 1}`];
        else nextRef = inputRefs.current[`${rowIdx + 1}-0`];
      }
      if (nextRef) { e.preventDefault(); nextRef.focus(); }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nextRef = inputRefs.current[`${rowIdx + 1}-${colIdx}`];
      if (nextRef) nextRef.focus();
      else e.currentTarget.blur();
    } else if (e.key === "Escape") {
      if (rowIdx < rows.length) {
        const saved = savedRef.current[rows[rowIdx].id];
        if (saved) setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...saved, costs: { ...saved.costs } } : r));
      } else {
        setNewRow(emptyNewRow(costColumns));
      }
      e.currentTarget.blur();
    }
  }

  const cell = "w-full px-3 py-2 bg-transparent text-sm border border-transparent rounded focus:border-primary/40 focus:bg-primary/5 transition-all outline-none placeholder:text-muted-foreground/30";
  const numCell = cell + " text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
              <p className="text-muted-foreground text-sm mt-1">{category.description}</p>
            )}
          </div>
          {canManage && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setManageColumnsOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Manage Columns
            </Button>
          )}
        </div>
      </motion.div>

      {/* Spreadsheet */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10">#</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[180px]">Product Name</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[160px]">Description</th>
                    {costColumns.map((col) => (
                      <th key={col.id} className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[130px] border-l border-border/20 whitespace-nowrap">
                        {col.name}
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary/70 uppercase tracking-wide min-w-[120px] border-l border-border/30 whitespace-nowrap">
                      Total Cost
                    </th>
                    <th className="w-10 px-2" />
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr
                      key={row.id}
                      className="group border-b border-border/20 hover:bg-muted/10 transition-colors"
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) saveRow(row.id);
                      }}
                    >
                      <td className="px-4 py-1.5 text-xs text-muted-foreground/40 font-medium w-10">{rowIdx + 1}</td>
                      <td className="px-1 py-1 min-w-[180px]">
                        <input
                          ref={(el) => { inputRefs.current[`${rowIdx}-0`] = el; }}
                          value={row.name}
                          onChange={(e) => setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, name: e.target.value } : r))}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, 0)}
                          placeholder="Product name"
                          className={cell}
                        />
                      </td>
                      <td className="px-1 py-1 min-w-[160px]">
                        <input
                          ref={(el) => { inputRefs.current[`${rowIdx}-1`] = el; }}
                          value={row.description}
                          onChange={(e) => setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, description: e.target.value } : r))}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, 1)}
                          placeholder="Description"
                          className={cell}
                        />
                      </td>
                      {costColumns.map((col, colIdx) => (
                        <td key={col.id} className="px-1 py-1 min-w-[130px] border-l border-border/10">
                          <input
                            ref={(el) => { inputRefs.current[`${rowIdx}-${colIdx + 2}`] = el; }}
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.costs[col.id] ?? ""}
                            onChange={(e) => setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, costs: { ...r.costs, [col.id]: e.target.value } } : r))}
                            onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx + 2)}
                            placeholder="0"
                            className={numCell}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-1.5 text-right font-semibold tabular-nums text-primary whitespace-nowrap border-l border-border/20 min-w-[120px]">
                        {formatCurrency(computeTotal(row.costs, costColumns))}
                      </td>
                      <td className="px-2 py-1.5 w-10">
                        <div className="flex items-center justify-center">
                          {savingIds.has(row.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/40" />
                          ) : (
                            <button
                              onClick={() => handleDelete(row.id, row.name)}
                              disabled={deletingId === row.id}
                              className="p-1 rounded text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40"
                              title="Delete product"
                            >
                              {deletingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* New row */}
                  <tr
                    className="group border-b border-dashed border-border/20 hover:bg-primary/5 transition-colors"
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) saveNewRow();
                    }}
                  >
                    <td className="px-4 py-1.5 w-10 text-center">
                      {savingNewRow
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/40 mx-auto" />
                        : <span className="text-sm text-muted-foreground/30">+</span>}
                    </td>
                    <td className="px-1 py-1 min-w-[180px]">
                      <input
                        ref={(el) => { inputRefs.current[`${rows.length}-0`] = el; }}
                        value={newRow.name}
                        onChange={(e) => setNewRow((prev) => ({ ...prev, name: e.target.value }))}
                        onKeyDown={(e) => handleKeyDown(e, rows.length, 0)}
                        placeholder="New product..."
                        className={cell}
                      />
                    </td>
                    <td className="px-1 py-1 min-w-[160px]">
                      <input
                        ref={(el) => { inputRefs.current[`${rows.length}-1`] = el; }}
                        value={newRow.description}
                        onChange={(e) => setNewRow((prev) => ({ ...prev, description: e.target.value }))}
                        onKeyDown={(e) => handleKeyDown(e, rows.length, 1)}
                        placeholder="Description"
                        className={cell}
                      />
                    </td>
                    {costColumns.map((col, colIdx) => (
                      <td key={col.id} className="px-1 py-1 min-w-[130px] border-l border-border/10">
                        <input
                          ref={(el) => { inputRefs.current[`${rows.length}-${colIdx + 2}`] = el; }}
                          type="number"
                          min="0"
                          step="0.01"
                          value={newRow.costs[col.id] ?? ""}
                          onChange={(e) => setNewRow((prev) => ({ ...prev, costs: { ...prev.costs, [col.id]: e.target.value } }))}
                          onKeyDown={(e) => handleKeyDown(e, rows.length, colIdx + 2)}
                          placeholder="0"
                          className={numCell}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right tabular-nums text-muted-foreground/40 border-l border-border/20 min-w-[120px] text-sm">
                      {newRow.name.trim() ? formatCurrency(computeTotal(newRow.costs, costColumns)) : "—"}
                    </td>
                    <td className="w-10" />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2 border-t border-border/20 bg-muted/10">
              <p className="text-xs text-muted-foreground/50">
                Click any cell to edit · Tab to move between cells · Enter to go to next row · Esc to revert · Changes save automatically
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
