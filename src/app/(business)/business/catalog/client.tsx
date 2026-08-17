"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Package,
  Columns3,
  Trash2,
  Pencil,
  ChevronRight,
  Loader2,
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
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  type ProductCategory,
} from "@/actions/product-catalog";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Props {
  categories: ProductCategory[];
  role: "owner" | "admin" | "member";
}

export default function CatalogClient({ categories, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit dialog
  const [editCat, setEditCat] = useState<ProductCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const canManage = role === "owner" || role === "admin";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    const fd = new FormData();
    fd.set("name", createName);
    fd.set("description", createDesc);
    const res = await createProductCategory(fd);
    setCreateLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Category created");
      setCreateOpen(false);
      setCreateName("");
      setCreateDesc("");
      startTransition(() => router.refresh());
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editCat) return;
    setEditLoading(true);
    const fd = new FormData();
    fd.set("id", editCat.id);
    fd.set("name", editName);
    fd.set("description", editDesc);
    const res = await updateProductCategory(fd);
    setEditLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Category updated");
      setEditCat(null);
      startTransition(() => router.refresh());
    }
  }

  async function handleDelete(cat: ProductCategory) {
    if (
      !confirm(
        `Delete "${cat.name}"? This will permanently delete all products and cost columns inside it.`
      )
    )
      return;
    const res = await deleteProductCategory(cat.id);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Category deleted");
      startTransition(() => router.refresh());
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
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Product Catalog
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        {canManage && (
          <Button
            className="gap-2 shadow-sm hover:shadow-md active:scale-[0.97]"
            onClick={() => setCreateOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            New Category
          </Button>
        )}
      </motion.div>

      {/* Category grid */}
      {categories.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No product categories yet.
              </p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 mt-1"
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create first category
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              <Link href={`/business/catalog/${cat.id}`}>
                <Card className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-tight">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Columns3 className="h-3.5 w-3.5" />
                        {cat.columnCount} cost column{cat.columnCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Edit / Delete actions (owner/admin) */}
              {canManage && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditCat(cat);
                      setEditName(cat.name);
                      setEditDesc(cat.description ?? "");
                    }}
                    className="p-1.5 rounded-md bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shadow-sm"
                    title="Edit category"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(cat);
                    }}
                    className="p-1.5 rounded-md bg-background border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Create Category Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Product Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="create-name">Category Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Electronics, Apparel"
                required
                className="bg-muted/30 border-border/50 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-desc">Description (optional)</Label>
              <Input
                id="create-desc"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Short description"
                className="bg-muted/30 border-border/50 h-10"
              />
            </div>
            <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading || isPending}>
                {createLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="bg-muted/30 border-border/50 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description (optional)</Label>
              <Input
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Short description"
                className="bg-muted/30 border-border/50 h-10"
              />
            </div>
            <DialogFooter className="-mx-4 -mb-4 px-4 pb-4 pt-4 bg-muted/50 rounded-b-xl border-t flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCat(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading || isPending}>
                {editLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
