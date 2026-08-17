"use server";

import { createClient } from "@/lib/supabase/server";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getInventory } from "@/actions/inventory";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[parseInt(month) - 1]} '${year.slice(2)}`;
}

export interface MonthlySalesStat {
  monthKey: string;
  month: string;
  revenue: number;
  units: number;
}

export interface SegmentStat {
  name: string;
  revenue: number;
  units: number;
}

export interface CategorySalesStat {
  name: string;
  revenue: number;
  units: number;
}

export interface ProductStat {
  name: string;
  category: string;
  revenue: number;
  units: number;
}

export interface SalesAnalytics {
  monthly: MonthlySalesStat[];
  bySegment: SegmentStat[];
  byCategory: CategorySalesStat[];
  topProducts: ProductStat[];
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  totalUnitsSold: number;
  totalTransactions: number;
}

export interface InventoryCategoryStat {
  name: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  outOfStockCount: number;
  lowStockCount: number;
  byCategory: InventoryCategoryStat[];
}

export async function getSalesAnalytics(): Promise<SalesAnalytics> {
  const session = await getBusinessSession();
  const empty: SalesAnalytics = {
    monthly: [],
    bySegment: [],
    byCategory: [],
    topProducts: [],
    totalRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    totalUnitsSold: 0,
    totalTransactions: 0,
  };
  if (!session) return empty;

  const supabase = await createClient();

  // Always build a full 12-month window
  const now = new Date();
  const monthlyMap = new Map<string, { revenue: number; units: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { revenue: 0, units: 0 });
  }

  const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    .toISOString()
    .split("T")[0];

  const { data: sales } = await supabase
    .from("sales")
    .select("total_amount, quantity, sale_date, segment_name, product_name, category_name")
    .eq("business_id", session.businessId)
    .gte("sale_date", windowStart)
    .order("sale_date", { ascending: true });

  if (!sales || sales.length === 0) {
    const monthly = Array.from(monthlyMap.entries()).map(([monthKey, v]) => ({
      monthKey,
      month: monthLabel(monthKey),
      ...v,
    }));
    return { ...empty, monthly };
  }

  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const segmentMap = new Map<string, { revenue: number; units: number }>();
  const categoryMap = new Map<string, { revenue: number; units: number }>();
  const productMap = new Map<string, { category: string; revenue: number; units: number }>();

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let totalTransactions = 0;
  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;

  for (const sale of sales) {
    const amount = Number(sale.total_amount);
    const qty = Number(sale.quantity);
    const mk = sale.sale_date.substring(0, 7);

    const m = monthlyMap.get(mk);
    if (m) {
      m.revenue += amount;
      m.units += qty;
    }

    const seg = segmentMap.get(sale.segment_name) ?? { revenue: 0, units: 0 };
    seg.revenue += amount;
    seg.units += qty;
    segmentMap.set(sale.segment_name, seg);

    const cat = categoryMap.get(sale.category_name) ?? { revenue: 0, units: 0 };
    cat.revenue += amount;
    cat.units += qty;
    categoryMap.set(sale.category_name, cat);

    const prod = productMap.get(sale.product_name) ?? { category: sale.category_name, revenue: 0, units: 0 };
    prod.revenue += amount;
    prod.units += qty;
    productMap.set(sale.product_name, prod);

    totalRevenue += amount;
    totalUnitsSold += qty;
    totalTransactions++;
    if (mk === thisMonthKey) thisMonthRevenue += amount;
    if (mk === lastMonthKey) lastMonthRevenue += amount;
  }

  const monthly = Array.from(monthlyMap.entries()).map(([monthKey, v]) => ({
    monthKey,
    month: monthLabel(monthKey),
    ...v,
  }));

  const bySegment = Array.from(segmentMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const byCategory = Array.from(categoryMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const topProducts = Array.from(productMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    monthly,
    bySegment,
    byCategory,
    topProducts,
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    totalUnitsSold,
    totalTransactions,
  };
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const categories = await getInventory();

  let totalProducts = 0;
  let totalUnits = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;

  const byCategory: InventoryCategoryStat[] = categories
    .filter((cat) => cat.products.length > 0)
    .map((cat) => {
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;

      for (const p of cat.products) {
        totalProducts++;
        totalUnits += p.quantity;
        if (p.quantity === 0) {
          outOfStock++;
          outOfStockCount++;
        } else if (p.quantity <= 5) {
          lowStock++;
          lowStockCount++;
        } else {
          inStock++;
        }
      }

      return { name: cat.name, inStock, lowStock, outOfStock };
    });

  return { totalProducts, totalUnits, outOfStockCount, lowStockCount, byCategory };
}
