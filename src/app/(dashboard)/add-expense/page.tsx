"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PlusCircle, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCreateExpense } from "@/hooks/useExpenses"
import { useRouter } from "next/navigation"

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
  expense_date: z.string().min(1, "Date is required"),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function AddExpensePage() {
  const router = useRouter()
  const { mutateAsync: createExpense, isPending } = useCreateExpense()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ExpenseFormValues>({
    // @ts-ignore: Next.js build strictness mismatch between Zod's coerce and useForm
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      category: "",
      description: "",
      expense_date: new Date().toISOString().split('T')[0],
    }
  })

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await createExpense(data)
      reset()
      router.push('/dashboard')
    } catch (error) {
      // Error handled by hook toast
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Add Expense</h1>
        <p className="text-muted-foreground">Manually log a new transaction.</p>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Fill in the details below to add a new expense.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (€)</Label>
              <Input 
                id="amount" 
                type="number" 
                placeholder="0.00" 
                step="0.01" 
                {...register("amount")}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="e.g., Grocery shopping" 
                {...register("description")}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category" 
                placeholder="e.g., Food, Transport, Utilities" 
                {...register("category")}
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                {...register("expense_date")}
              />
              {errors.expense_date && <p className="text-sm text-destructive">{errors.expense_date.message}</p>}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              {isPending ? "Adding..." : "Add Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
