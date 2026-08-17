"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { TrendingUp, Search, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SaleRecord } from "@/actions/sales";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  sales: SaleRecord[];
}

export default function SalesListClient({ sales }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.product_name.toLowerCase().includes(q) ||
        s.category_name.toLowerCase().includes(q) ||
        s.segment_name.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total_amount, 0);
  const totalUnits = filtered.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Sales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sales.length} transaction{sales.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Units Sold</p>
            <p className="text-2xl font-bold mt-1">{totalUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Transactions</p>
            <p className="text-2xl font-bold mt-1">{filtered.length.toLocaleString()}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product, category, segment…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/30 border-border/50 h-9"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {sales.length === 0 ? "No sales recorded yet." : "No results match your search."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Segment</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price/Unit</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filtered.map((sale) => (
                        <tr key={sale.id} className="hover:bg-muted/15 transition-colors">
                          <td className="px-5 py-3 font-medium">{sale.product_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{sale.category_name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[11px] px-2 bg-primary/5 text-primary border-primary/20">
                              {sale.segment_name}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{sale.quantity}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatCurrency(sale.selling_price_per_unit)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(sale.total_amount)}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(sale.sale_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border/30">
                  {filtered.map((sale) => (
                    <div key={sale.id} className="p-4 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{sale.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sale.category_name} · {formatDate(sale.sale_date)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-sm">{formatCurrency(sale.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">Qty {sale.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 bg-primary/5 text-primary border-primary/20">
                          {sale.segment_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(sale.selling_price_per_unit)}/unit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
