"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
import { Select } from "@/components/ui/select";
import {
  useExpenses,
  useDeleteExpense,
  useUpdateExpense,
} from "@/hooks/useExpenses";
import {
  Search,
  Trash2,
  Edit,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";
import type { Expense } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function ExpensesPage() {
  const { data: expenses, isLoading, isError } = useExpenses();
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();
  const { mutateAsync: updateExpense, isPending: isUpdating } =
    useUpdateExpense();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    major_category: "",
    category: "",
    expense_date: "",
  });
  const uniqueCategories = useMemo(() => {
    if (!expenses) return [];
    const seen = new Map<string, string>();
    for (const e of expenses) {
      const lower = e.category.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, e.category);
    }
    return Array.from(seen.values());
  }, [expenses]);

  const uniqueMajorCategories = useMemo(() => {
    if (!expenses) return [];
    const seen = new Map<string, string>();
    for (const e of expenses) {
      const val = e.major_category || "Daily Expense";
      const lower = val.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, val);
    }
    return Array.from(seen.values());
  }, [expenses]);

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

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (!searchTerm) return expenses;
    const term = searchTerm.toLowerCase();
    return expenses.filter(
      (expense) =>
        expense.description?.toLowerCase().includes(term) ||
        expense.category.toLowerCase().includes(term) ||
        expense.major_category?.toLowerCase().includes(term),
    );
  }, [expenses, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedExpenses = filteredExpenses.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

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
            onChange={(e) => handleSearch(e.target.value)}
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
                  paginatedExpenses.map((expense, index) => (
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

        {/* Pagination Controls */}
        {filteredExpenses.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing {(safeCurrentPage - 1) * pageSize + 1}–
                {Math.min(safeCurrentPage * pageSize, filteredExpenses.length)}{" "}
                of {filteredExpenses.length} expenses
              </span>
              <span className="hidden sm:inline">·</span>
              <div className="hidden sm:flex items-center gap-1.5">
                <Label
                  htmlFor="page-size"
                  className="text-muted-foreground text-xs"
                >
                  Rows
                </Label>
                <select
                  id="page-size"
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium">
                {safeCurrentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safeCurrentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
              <Select
                id="edit-major-category"
                value={editForm.major_category}
                options={
                  uniqueMajorCategories.includes(editForm.major_category)
                    ? uniqueMajorCategories
                    : editForm.major_category
                      ? [editForm.major_category, ...uniqueMajorCategories]
                      : uniqueMajorCategories
                }
                onChange={(mc) =>
                  setEditForm((f) => {
                    if (mc !== "Daily Expense") {
                      return { ...f, major_category: mc, category: mc };
                    }
                    return { ...f, major_category: mc };
                  })
                }
              />
            </div>
            {editForm.major_category === "Daily Expense" && (
              <div className="space-y-2">
                <Label htmlFor="edit-category">Sub Category</Label>
                <Select
                  id="edit-category"
                  value={editForm.category}
                  options={
                    uniqueCategories.includes(editForm.category)
                      ? uniqueCategories
                      : editForm.category
                        ? [editForm.category, ...uniqueCategories]
                        : uniqueCategories
                  }
                  onChange={(cat) =>
                    setEditForm((f) => ({ ...f, category: cat }))
                  }
                />
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
