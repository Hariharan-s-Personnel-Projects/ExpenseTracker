"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExpenses,
  useDeleteExpense,
  useUpdateExpense,
} from "@/hooks/useExpenses";
import { Search, Trash2, Edit, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Expense } from "@/types";

export default function ExpensesPage() {
  const { data: expenses, isLoading, isError } = useExpenses();
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();
  const { mutateAsync: updateExpense, isPending: isUpdating } =
    useUpdateExpense();

  const [searchTerm, setSearchTerm] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    major_category: "",
    category: "",
    expense_date: "",
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const uniqueCategories = useMemo(() => {
    if (!expenses) return [];
    const seen = new Map<string, string>();
    for (const e of expenses) {
      const lower = e.category.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, e.category);
    }
    return Array.from(seen.values());
  }, [expenses]);

  const filteredSuggestions = useMemo(() => {
    if (!editForm.category) return [];
    return uniqueCategories.filter(
      (cat) =>
        cat.toLowerCase().includes(editForm.category.toLowerCase()) &&
        cat.toLowerCase() !== editForm.category.toLowerCase(),
    );
  }, [editForm.category, uniqueCategories]);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-primary">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      amount: String(expense.amount),
      description: expense.description || "",
      major_category: expense.major_category || "Daily Expense",
      category: expense.category,
      expense_date: expense.expense_date,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    await updateExpense({
      id: editingExpense.id,
      amount: Number(editForm.amount),
      description: editForm.description,
      major_category: editForm.major_category,
      category: editForm.category,
      expense_date: editForm.expense_date,
    });
    setEditingExpense(null);
  };

  const filteredExpenses =
    expenses?.filter(
      (expense) =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.major_category
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10 pt-2 sm:pt-4">
      <motion.div
        className="flex flex-col gap-1 items-start md:flex-row md:items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Expenses
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and view all your transactions.
          </p>
        </div>
        <div className="w-full md:w-72 mt-3 md:mt-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10">
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              A detailed history of your spending.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Major Category</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-16 ml-auto rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2 text-destructive/50" />
                        <p>Failed to load expenses.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No matching expenses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense, index) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0"
                    >
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(expense.expense_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description || (
                          <span className="text-muted-foreground italic">
                            No description
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors"
                        >
                          {expense.major_category || "Daily Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expense.major_category !== expense.category ? (
                          <Badge
                            variant="secondary"
                            className="bg-secondary/50 hover:bg-secondary/80 text-xs font-normal transition-colors"
                          >
                            {expense.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{Number(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => deleteExpense(expense.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Expense Dialog */}
      <Dialog
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details of this expense.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, amount: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="e.g., Grocery shopping"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-major-category">Major Category</Label>
              <Input
                id="edit-major-category"
                placeholder="e.g., Daily Expense, Learning"
                value={editForm.major_category}
                onChange={(e) =>
                  setEditForm((f) => {
                    const mc = e.target.value;
                    // If not "Daily Expense", sync category to major_category
                    if (mc !== "Daily Expense") {
                      return { ...f, major_category: mc, category: mc };
                    }
                    return { ...f, major_category: mc };
                  })
                }
                required
              />
            </div>
            {editForm.major_category === "Daily Expense" && (
              <div className="space-y-2 relative">
                <Label htmlFor="edit-category">Sub Category</Label>
                <Input
                  id="edit-category"
                  placeholder="e.g., Food, Transport"
                  autoComplete="off"
                  ref={categoryInputRef}
                  value={editForm.category}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, category: e.target.value }));
                    setShowSuggestions(true);
                  }}
                  required
                />
                <AnimatePresence>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                      ref={suggestionsRef}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-lg border border-border/60 bg-popover shadow-lg overflow-hidden"
                    >
                      <div className="px-3 py-1.5 border-b border-border/40">
                        <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                          Suggestions
                        </p>
                      </div>
                      <div className="max-h-36 overflow-y-auto py-1">
                        {filteredSuggestions.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent/60 hover:text-accent-foreground transition-colors cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEditForm((f) => ({ ...f, category: cat }));
                              setShowSuggestions(false);
                            }}
                          >
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20 text-xs px-1.5 py-0"
                            >
                              {highlightMatch(cat, editForm.category)}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.expense_date}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, expense_date: e.target.value }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingExpense(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
