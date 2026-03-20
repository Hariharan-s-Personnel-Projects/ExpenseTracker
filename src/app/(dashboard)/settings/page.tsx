"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useUserBudget, useUpdateBudget } from "@/hooks/useExpenses";

export default function SettingsPage() {
  const { data, isLoading } = useUserBudget();
  const { mutate: updateBudget, isPending } = useUpdateBudget();
  const [monthlyLimit, setMonthlyLimit] = useState("");

  useEffect(() => {
    if (data?.monthlyBudget !== undefined) {
      setMonthlyLimit(String(data.monthlyBudget));
    }
  }, [data?.monthlyBudget]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(monthlyLimit);
    if (!isNaN(value) && value >= 0) {
      updateBudget(value);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto pb-6 sm:pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account preferences and budget configurations.
        </p>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Budget Preferences</CardTitle>
          <CardDescription>
            Set your global monthly budget limits for tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="monthly-limit">Monthly Limit (₹)</Label>
              <Input
                id="monthly-limit"
                type="number"
                min={0}
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="gap-2"
              disabled={isLoading || isPending}
            >
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
