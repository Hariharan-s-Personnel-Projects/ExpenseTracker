"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, AlertCircle, Loader2, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { submitBusinessExpense } from "@/actions/business-expenses";
import { toast } from "sonner";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getBusinessCategories } from "@/actions/business-expenses";

export default function SubmitExpensePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["business-categories"],
    queryFn: () => getBusinessCategories(),
  });

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    if (category) formData.set("category", category);
    const res = await submitBusinessExpense(formData);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      toast.success("Expense submitted for approval");
      router.push("/business/expenses");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-xl space-y-6"
    >
      <div className="flex items-center gap-3">
        <Link href="/business/expenses">
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" />
            Submit Expense
          </h1>
          <p className="text-muted-foreground text-sm">Fill in the details to submit for approval.</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <form action={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                  className="bg-muted/30 border-border/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  name="expenseDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="bg-muted/30 border-border/50 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                options={categories.map((c) => c.name)}
                onChange={setCategory}
                placeholder="Select a category"
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory (optional)</Label>
              <Input
                id="subcategory"
                name="subcategory"
                type="text"
                placeholder="e.g. Flight, Lunch, etc."
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                type="text"
                placeholder="What was this expense for?"
                required
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                name="notes"
                type="text"
                placeholder="Additional context or justification"
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 shadow-sm hover:shadow-md active:scale-[0.97]"
              disabled={isLoading || !category}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Submit for Approval
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
