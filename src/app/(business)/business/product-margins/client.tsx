"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Tag,
  Settings2,
  GripVertical,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  PlusCircle,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  upsertProductSellingConfig,
  addSellingCostColumn,
  renameSellingCostColumn,
  deleteSellingCostColumn,
  reorderSellingCostColumns,
  getSellingData,
  type SellingCostColumn,
  type SellingCategoryGroup,
} from "@/actions/selling";
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

const typeConfig: Record<string, { className: string }> = {
  B2B: { className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  B2C: { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  Other: { className: "bg-muted text-muted-foreground border-border/50" },
};

interface Props {
  segments: CustomerSegment[];
  initialGroups: SellingCategoryGroup[];
  initialSegmentId: string | null;
  role: "owner" | "admin" | "member";
}

interface EditableProductRow {
  id: string;
  name: string;
  costPrice: number;
  sellingCosts: Record<string, string>;
  marginPercent: string;
}

function toEditable(p: SellingCategoryGroup["products"][0], cols: SellingCostColumn[]): EditableProductRow {
  return {
    id: p.id,
    name: p.name,
    costPrice: p.costPrice,
    sellingCosts: Object.fromEntries(cols.map((c) => [c.id, (p.sellingCosts[c.id] ?? 0).toString()])),
    marginPercent: p.marginPercent.toString(),
  };
}

function computeSelling(row: EditableProductRow, cols: SellingCostColumn[]) {
  const sellingCostsTotal = cols.reduce(
    (s, c) => s + (parseFloat(row.sellingCosts[c.id] ?? "0") || 0),
    0
  );
  const totalCost = row.costPrice + sellingCostsTotal;
  const margin = parseFloat(row.marginPercent) || 0;
  const sellingPrice = totalCost * (1 + margin / 100);
  const profit = sellingPrice - totalCost;
  return { sellingCostsTotal, totalCost, sellingPrice, profit };
}

// ─── Manage Selling Columns Dialog ────────────────────────────────────────────

function ManageSellingColumnsDialog({
  open,
  onOpenChange,
  categoryId,
  segmentId,
  columns,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoryId: string;
  segmentId: string;
  columns: SellingCostColumn[];
  onRefresh: () => void;
}) {
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [localCols, setLocalCols] = useState<SellingCostColumn[]>(columns);
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
    fd.set("segmentId", segmentId);
    fd.set("name", newColName.trim());
    const res = await addSellingCostColumn(fd);
    setAddingCol(false);
    if (res?.error) toast.error(res.error);
    else { setNewColName(""); toast.success("Column added"); onRefresh(); }
  }

  async function handleRename(colId: string) {
    if (!editingName.trim()) { setEditingId(null); return; }
    const fd = new FormData();
    fd.set("columnId", colId);
    fd.set("name", editingName.trim());
    const res = await renameSellingCostColumn(fd);
    if (res?.error) toast.error(res.error);
    else { toast.success("Column renamed"); setEditingId(null); onRefresh(); }
  }

  async function handleDelete(colId: string) {
    if (!confirm("Delete this selling cost column? All cost data for this column will be lost.")) return;
    setDeletingId(colId);
    const res = await deleteSellingCostColumn(colId);
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
    dragItem.current = null; dragOver.current = null;
    setReordering(true);
    await reorderSellingCostColumns(localCols.map((c) => c.id));
    setReordering(false);
    onRefresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Manage Selling Cost Columns
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {localCols.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No selling cost columns yet. Add one below.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Drag to reorder</p>
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
                      autoFocus value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(col.id); if (e.key === "Escape") setEditingId(null); }}
                      className="h-7 text-sm bg-background border-primary/40 flex-1"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium">{col.name}</span>
                  )}
                  <div className="flex gap-1 shrink-0">
                    {editingId === col.id ? (
                      <>
                        <button onClick={() => handleRename(col.id)} className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 transition-colors"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 rounded text-muted-foreground hover:bg-muted/50 transition-colors"><X className="h-3.5 w-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(col.id); setEditingName(col.name); }} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(col.id)} disabled={deletingId === col.id} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40">
                          {deletingId === col.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Add new column</p>
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                value={newColName} onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. Customer Acquisition, Travel"
                className="bg-muted/30 border-border/50 h-9 flex-1 text-sm" required
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

// ─── Category Selling Table ────────────────────────────────────────────────────

function CategorySellingTable({
  group,
  segmentId,
  role,
  onRefresh,
}: {
  group: SellingCategoryGroup;
  segmentId: string;
  role: "owner" | "admin" | "member";
  onRefresh: () => void;
}) {
  const [rows, setRows] = useState<EditableProductRow[]>(() =>
    group.products.map((p) => toEditable(p, group.costColumns))
  );
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [manageOpen, setManageOpen] = useState(false);
  const savedRef = useRef<Record<string, EditableProductRow>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const canManage = role === "owner" || role === "admin";
  const totalCols = group.costColumns.length + 1; // selling cost cols + margin

  useEffect(() => {
    const synced = group.products.map((p) => toEditable(p, group.costColumns));
    setRows(synced);
    savedRef.current = Object.fromEntries(
      synced.map((r) => [r.id, { ...r, sellingCosts: { ...r.sellingCosts } }])
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.products, group.costColumns]);

  async function saveRow(rowId: string) {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const saved = savedRef.current[rowId];
    const isDirty = !saved ||
      saved.marginPercent !== row.marginPercent ||
      group.costColumns.some((c) => saved.sellingCosts[c.id] !== row.sellingCosts[c.id]);
    if (!isDirty) return;

    setSavingIds((prev) => new Set(prev).add(rowId));
    const fd = new FormData();
    fd.set("productId", rowId);
    fd.set("segmentId", segmentId);
    fd.set("marginPercent", row.marginPercent);
    fd.set("columnIds", group.costColumns.map((c) => c.id).join(","));
    for (const col of group.costColumns) fd.set(`cost_${col.id}`, row.sellingCosts[col.id] || "0");

    const res = await upsertProductSellingConfig(fd);
    setSavingIds((prev) => { const s = new Set(prev); s.delete(rowId); return s; });

    if (res?.error) {
      toast.error(res.error);
      if (saved) setRows((prev) => prev.map((r) => r.id === rowId ? { ...saved, sellingCosts: { ...saved.sellingCosts } } : r));
    } else {
      savedRef.current[rowId] = { ...row, sellingCosts: { ...row.sellingCosts } };
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) {
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
      if (nextRef) nextRef.focus(); else e.currentTarget.blur();
    } else if (e.key === "Escape") {
      const saved = savedRef.current[rows[rowIdx]?.id];
      if (saved) setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...saved, sellingCosts: { ...saved.sellingCosts } } : r));
      e.currentTarget.blur();
    }
  }

  const numCell = "w-full px-3 py-2 bg-transparent text-sm text-right tabular-nums border border-transparent rounded focus:border-primary/40 focus:bg-primary/5 transition-all outline-none placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold tracking-tight">{group.name}</h2>
          {canManage && (
            <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={() => setManageOpen(true)}>
              <Settings2 className="h-3.5 w-3.5" />
              Selling Costs
            </Button>
          )}
        </div>

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
                      <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[160px]">Product</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[120px] border-l border-border/20 whitespace-nowrap">
                        Cost Price
                        <span className="normal-case font-normal text-muted-foreground/60 ml-1">(catalog)</span>
                      </th>
                      {group.costColumns.map((col) => (
                        <th key={col.id} className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[130px] border-l border-border/20 whitespace-nowrap">
                          {col.name}
                        </th>
                      ))}
                      <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[110px] border-l border-border/20 whitespace-nowrap">
                        Total Cost
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[100px] border-l border-border/20 whitespace-nowrap">
                        Margin %
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-primary/70 uppercase tracking-wide min-w-[120px] border-l border-border/30 whitespace-nowrap">
                        Selling Price
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-600/70 uppercase tracking-wide min-w-[100px] border-l border-border/20 whitespace-nowrap">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => {
                      const { totalCost, sellingPrice, profit } = computeSelling(row, group.costColumns);
                      return (
                        <tr
                          key={row.id}
                          className="group border-b border-border/20 hover:bg-muted/10 transition-colors"
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) saveRow(row.id);
                          }}
                        >
                          <td className="px-4 py-1.5 text-xs text-muted-foreground/40 font-medium w-10">{rowIdx + 1}</td>
                          <td className="px-3 py-2 font-medium text-sm min-w-[160px]">{row.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-sm text-muted-foreground border-l border-border/20 min-w-[120px] whitespace-nowrap">
                            {formatCurrency(row.costPrice)}
                          </td>
                          {group.costColumns.map((col, colIdx) => (
                            <td key={col.id} className="px-1 py-1 min-w-[130px] border-l border-border/10">
                              <input
                                ref={(el) => { inputRefs.current[`${rowIdx}-${colIdx}`] = el; }}
                                type="number" min="0" step="0.01"
                                value={row.sellingCosts[col.id] ?? ""}
                                onChange={(e) => setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, sellingCosts: { ...r.sellingCosts, [col.id]: e.target.value } } : r))}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                placeholder="0"
                                className={numCell}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right tabular-nums text-sm font-medium border-l border-border/20 min-w-[110px] whitespace-nowrap">
                            {formatCurrency(totalCost)}
                          </td>
                          <td className="px-1 py-1 min-w-[100px] border-l border-border/20">
                            <input
                              ref={(el) => { inputRefs.current[`${rowIdx}-${group.costColumns.length}`] = el; }}
                              type="number" min="0" step="0.01"
                              value={row.marginPercent}
                              onChange={(e) => setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, marginPercent: e.target.value } : r))}
                              onKeyDown={(e) => handleKeyDown(e, rowIdx, group.costColumns.length)}
                              placeholder="0"
                              className={numCell}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums text-primary border-l border-border/30 min-w-[120px] whitespace-nowrap">
                            {savingIds.has(row.id)
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/40 ml-auto" />
                              : formatCurrency(sellingPrice)
                            }
                          </td>
                          <td className={`px-4 py-2 text-right font-semibold tabular-nums border-l border-border/20 min-w-[100px] whitespace-nowrap ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {formatCurrency(profit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-border/20 bg-muted/10">
                <p className="text-xs text-muted-foreground/50">
                  Click a cell to edit · Tab to move · Enter for next row · Esc to revert · Saves automatically
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ManageSellingColumnsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        categoryId={group.id}
        segmentId={segmentId}
        columns={group.costColumns}
        onRefresh={onRefresh}
      />
    </>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function SellingClient({
  segments,
  initialGroups,
  initialSegmentId,
  role,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(initialSegmentId);
  const [groups, setGroups] = useState<SellingCategoryGroup[]>(initialGroups);
  const [loadingSegment, setLoadingSegment] = useState(false);

  async function handleSegmentChange(segmentId: string) {
    if (segmentId === selectedSegmentId) return;
    setSelectedSegmentId(segmentId);
    setLoadingSegment(true);
    const data = await getSellingData(segmentId);
    setGroups(data);
    setLoadingSegment(false);
  }

  function refresh() {
    startTransition(async () => {
      router.refresh();
      if (selectedSegmentId) {
        const data = await getSellingData(selectedSegmentId);
        setGroups(data);
      }
    });
  }

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

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
          <Tag className="h-6 w-6 text-primary" />
          Product Margins
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure selling costs and margins independently per customer segment.
        </p>
      </motion.div>

      {/* No segments state */}
      {segments.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-8 py-16 text-center"
        >
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No customer segments yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Create segments like &quot;Hyderabad B2B&quot; or &quot;Chennai B2C&quot; to configure margins.
          </p>
          <Link href="/business/customers" className={buttonVariants({ size: "sm", className: "mt-4 gap-2" })}>
              <Users className="h-4 w-4" />
              Manage Customer Segments
            </Link>
        </motion.div>
      ) : (
        <>
          {/* Segment Tabs */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {segments.map((seg) => {
                const isActive = seg.id === selectedSegmentId;
                const tc = typeConfig[seg.type] ?? typeConfig.Other;
                return (
                  <button
                    key={seg.id}
                    onClick={() => handleSegmentChange(seg.id)}
                    disabled={loadingSegment}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-60 ${
                      isActive
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border/40 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-border/60"
                    }`}
                  >
                    {seg.name}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${tc.className}`}>
                      {seg.type}
                    </span>
                  </button>
                );
              })}
              <Link
                href="/business/customers"
                className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-muted/30 transition-all whitespace-nowrap"
              >
                <Users className="h-3.5 w-3.5" />
                Manage
              </Link>
            </div>
          </motion.div>

          {/* Segment label */}
          {selectedSegment && (
            <motion.div variants={fadeUp} className="-mt-2">
              <p className="text-xs text-muted-foreground">
                Showing margins for <span className="font-semibold text-foreground">{selectedSegment.name}</span>
              </p>
            </motion.div>
          )}

          {/* Tables */}
          <motion.div
            variants={fadeUp}
            className={`space-y-8 transition-opacity duration-200 ${loadingSegment ? "opacity-40 pointer-events-none" : ""}`}
          >
            {loadingSegment && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingSegment && groups.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-6 py-12 text-center">
                <Tag className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No product categories found.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add products in the Product Catalog first.</p>
              </div>
            )}
            {!loadingSegment && selectedSegmentId && groups.map((group) => (
              <CategorySellingTable
                key={group.id}
                group={group}
                segmentId={selectedSegmentId}
                role={role}
                onRefresh={refresh}
              />
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
