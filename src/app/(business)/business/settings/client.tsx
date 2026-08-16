"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Plus, Trash2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface Category {
  id: string;
  name: string;
  monthly_budget: number | null;
}

interface Props {
  businessInfo: {
    id: string;
    name: string;
    industry: string | null;
    invite_code: string | null;
    currency: string;
  } | null;
  categories: Category[];
  role: "owner" | "admin";
}

export default function SettingsClient({ businessInfo, categories: initialCategories, role }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  function copyInviteCode() {
    if (businessInfo?.invite_code) {
      navigator.clipboard.writeText(businessInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function addCategory() {
    if (!newCatName.trim() || !businessInfo) return;
    setIsAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("business_categories")
      .insert({
        business_id: businessInfo.id,
        name: newCatName.trim(),
        monthly_budget: newCatBudget ? parseFloat(newCatBudget) : null,
      })
      .select("id, name, monthly_budget")
      .single();

    if (error) {
      toast.error(error.message);
    } else if (data) {
      setCategories((prev) => [...prev, data]);
      setNewCatName("");
      setNewCatBudget("");
      toast.success("Category added");
    }
    setIsAdding(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("business_categories")
      .delete()
      .eq("id", id);

    if (error) toast.error(error.message);
    else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6 max-w-2xl"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          Business Settings
        </h1>
      </motion.div>

      {/* Business info */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{businessInfo?.name}</span>
            </div>
            <div className="flex justify-between border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{businessInfo?.industry ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Invite Code</span>
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-2 font-mono text-primary text-xs bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors"
              >
                {businessInfo?.invite_code}
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense categories */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border/30">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.monthly_budget && (
                      <p className="text-xs text-muted-foreground">
                        Budget: ₹{Number(c.monthly_budget).toLocaleString("en-IN")} / month
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Add Category
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="bg-muted/30 border-border/50 h-9 flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <Input
                  placeholder="Budget (optional)"
                  type="number"
                  value={newCatBudget}
                  onChange={(e) => setNewCatBudget(e.target.value)}
                  className="bg-muted/30 border-border/50 h-9 w-36"
                />
                <Button
                  size="sm"
                  className="h-9 gap-1.5 shrink-0"
                  onClick={addCategory}
                  disabled={!newCatName.trim() || isAdding}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
