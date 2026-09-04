"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, PlusCircle, Pencil, Trash2, Loader2, Copy, ArrowLeftRight } from "lucide-react";
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
  createCustomerSegment,
  updateCustomerSegment,
  deleteCustomerSegment,
  copySegmentConfig,
  syncNewProductsToSegment,
  copyAllToSegment,
  type CustomerSegment,
} from "@/actions/customers";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const SEGMENT_TYPES = ["B2B", "B2C", "Other"] as const;

const typeConfig: Record<string, { label: string; className: string }> = {
  B2B: { label: "B2B", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  B2C: { label: "B2C", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  Other: { label: "Other", className: "bg-muted text-muted-foreground border-border/50" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  segments: CustomerSegment[];
  role: "owner" | "admin" | "member";
}

export default function CustomersClient({ segments, role }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<string>("B2B");
  const [createLoading, setCreateLoading] = useState(false);

  const [editSeg, setEditSeg] = useState<CustomerSegment | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<string>("B2B");
  const [editLoading, setEditLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [copySeg, setCopySeg] = useState<CustomerSegment | null>(null);
  const [copyName, setCopyName] = useState("");
  const [copyType, setCopyType] = useState<string>("B2B");
  const [copyLoading, setCopyLoading] = useState(false);

  const [syncSeg, setSyncSeg] = useState<CustomerSegment | null>(null);
  const [syncTarget, setSyncTarget] = useState("");
  const [syncMode, setSyncMode] = useState<"new" | "all">("new");
  const [syncLoading, setSyncLoading] = useState(false);

  const canManage = role === "owner" || role === "admin";

  function refresh() { startTransition(() => router.refresh()); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    const fd = new FormData();
    fd.set("name", createName);
    fd.set("type", createType);
    const res = await createCustomerSegment(fd);
    setCreateLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Customer segment created");
      setCreateOpen(false);
      setCreateName("");
      setCreateType("B2B");
      refresh();
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editSeg) return;
    setEditLoading(true);
    const fd = new FormData();
    fd.set("id", editSeg.id);
    fd.set("name", editName);
    fd.set("type", editType);
    const res = await updateCustomerSegment(fd);
    setEditLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Segment updated");
      setEditSeg(null);
      refresh();
    }
  }

  async function handleDelete(seg: CustomerSegment) {
    if (!confirm(`Delete "${seg.name}"? All margin configurations for this segment will be lost.`)) return;
    setDeletingId(seg.id);
    const res = await deleteCustomerSegment(seg.id);
    setDeletingId(null);
    if (res?.error) toast.error(res.error);
    else { toast.success("Segment deleted"); refresh(); }
  }

  function openCopy(seg: CustomerSegment) {
    setCopySeg(seg);
    setCopyName(`Copy of ${seg.name}`);
    setCopyType(seg.type);
  }

  async function handleCopy(e: React.FormEvent) {
    e.preventDefault();
    if (!copySeg) return;
    setCopyLoading(true);
    const fd = new FormData();
    fd.set("sourceSegmentId", copySeg.id);
    fd.set("name", copyName);
    fd.set("type", copyType);
    const res = await copySegmentConfig(fd);
    setCopyLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Segment copied with all prices & margins");
      setCopySeg(null);
      setCopyName("");
      setCopyType("B2B");
      refresh();
    }
  }

  function openSync(seg: CustomerSegment) {
    setSyncSeg(seg);
    setSyncTarget("");
    setSyncMode("new");
  }

  async function handleSync(e: React.FormEvent) {
    e.preventDefault();
    if (!syncSeg || !syncTarget) return;
    setSyncLoading(true);
    const fd = new FormData();
    fd.set("sourceSegmentId", syncSeg.id);
    fd.set("targetSegmentId", syncTarget);
    const res = syncMode === "new"
      ? await syncNewProductsToSegment(fd)
      : await copyAllToSegment(fd);
    setSyncLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      const count = (res as { count?: number }).count ?? 0;
      toast.success(
        syncMode === "new"
          ? `${count} new product${count !== 1 ? "s" : ""} copied to segment`
          : `${count} product${count !== 1 ? "s" : ""} synced (prices & margins overwritten)`
      );
      setSyncSeg(null);
      refresh();
    }
  }

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
            <Users className="h-6 w-6 text-primary" />
            Customer Segments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {segments.length} segment{segments.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            New Segment
          </Button>
        )}
      </motion.div>

      {/* Grid */}
      {segments.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-8 py-16 text-center"
        >
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No customer segments yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Create segments like &quot;Hyderabad B2B&quot; or &quot;Chennai B2C&quot; to configure independent margins.
          </p>
          {canManage && (
            <Button size="sm" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              New Segment
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {segments.map((seg) => {
            const tc = typeConfig[seg.type] ?? typeConfig.Other;
            return (
              <div key={seg.id} className="group relative rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                {/* Hover actions */}
                {canManage && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openSync(seg)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                      title="Sync products to another segment"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openCopy(seg)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Copy segment with prices & margins"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditSeg(seg); setEditName(seg.name); setEditType(seg.type); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      title="Edit segment"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(seg)}
                      disabled={deletingId === seg.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                      title="Delete segment"
                    >
                      {deletingId === seg.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}

                {/* Type badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${tc.className}`}>
                  {tc.label}
                </span>

                {/* Name */}
                <h3 className="mt-2.5 font-semibold text-base leading-tight">{seg.name}</h3>

                {/* Date */}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Created {formatDate(seg.created_at)}
                </p>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setCreateName(""); setCreateType("B2B"); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              New Customer Segment
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="create-name">Segment Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Hyderabad B2B, Chennai B2C"
                className="bg-muted/30 border-border/50 h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {SEGMENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCreateType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      createType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createLoading} className="gap-2">
                {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={!!syncSeg} onOpenChange={(o) => { if (!o) setSyncSeg(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-amber-600" />
              Sync Products to Segment
            </DialogTitle>
          </DialogHeader>
          {syncSeg && (
            <p className="text-xs text-muted-foreground -mt-1">
              Sync product prices &amp; margins from <span className="font-medium text-foreground">{syncSeg.name}</span> to another segment.
            </p>
          )}
          <form onSubmit={handleSync} className="space-y-4 pt-1">
            <div className="space-y-2">
              <label htmlFor="sync-target" className="text-sm font-medium leading-none">
                Target Segment
              </label>
              <select
                id="sync-target"
                value={syncTarget}
                onChange={(e) => setSyncTarget(e.target.value)}
                required
                className="w-full h-10 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="" disabled>Select a segment…</option>
                {segments
                  .filter((s) => s.id !== syncSeg?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Sync Mode</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSyncMode("new")}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                    syncMode === "new"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <span className="font-medium block">New products only</span>
                  <span className="text-xs opacity-70">Copy products that exist in source but are missing from target</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSyncMode("all")}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                    syncMode === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <span className="font-medium block">All products (overwrite)</span>
                  <span className="text-xs opacity-70">Copy all products and overwrite existing prices &amp; margins in target</span>
                </button>
              </div>
            </div>

            <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setSyncSeg(null)}>Cancel</Button>
              <Button type="submit" disabled={syncLoading || !syncTarget} className="gap-2">
                {syncLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                Sync
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Copy Dialog */}
      <Dialog open={!!copySeg} onOpenChange={(o) => { if (!o) { setCopySeg(null); setCopyName(""); setCopyType("B2B"); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" />
              Copy Segment
            </DialogTitle>
          </DialogHeader>
          {copySeg && (
            <p className="text-xs text-muted-foreground -mt-1">
              All prices, selling costs, and margins from <span className="font-medium text-foreground">{copySeg.name}</span> will be copied to the new segment.
            </p>
          )}
          <form onSubmit={handleCopy} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="copy-name">New Segment Name</Label>
              <Input
                id="copy-name"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                placeholder="e.g. Mumbai B2B"
                className="bg-muted/30 border-border/50 h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {SEGMENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCopyType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      copyType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setCopySeg(null)}>Cancel</Button>
              <Button type="submit" disabled={copyLoading} className="gap-2">
                {copyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Copy Segment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSeg} onOpenChange={(o) => !o && setEditSeg(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Edit Segment
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Segment Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-muted/30 border-border/50 h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {SEGMENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      editType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditSeg(null)}>Cancel</Button>
              <Button type="submit" disabled={editLoading} className="gap-2">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
