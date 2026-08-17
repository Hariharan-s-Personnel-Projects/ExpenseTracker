import { requireNonSalesSession } from "@/lib/auth/guards";
import { getBusinessExpenses, getBusinessCategories } from "@/actions/business-expenses";
import BusinessExpensesClient from "./client";

interface SearchParams {
  status?: string;
  category?: string;
  search?: string;
  page?: string;
}

export default async function BusinessExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireNonSalesSession();

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const filters = {
    status: params.status,
    category: params.category,
    search: params.search,
    page,
    limit: 20,
  };

  const [{ expenses, total }, categories] = await Promise.all([
    getBusinessExpenses(filters),
    getBusinessCategories(),
  ]);

  return (
    <BusinessExpensesClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expenses={expenses as any}
      total={total}
      page={page}
      limit={20}
      categories={categories}
      role={session.role}
      filters={filters}
    />
  );
}
