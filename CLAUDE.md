# Tracker AI — CLAUDE.md

Next.js 16 App Router + React 19. Two sub-apps: personal finance (`/(dashboard)`) and business (`/(business)`).
Supabase used as DB only — NOT for auth. Custom JWT auth via `jose`. INR currency throughout.

---

## Feature Implementation Pattern (follow exactly)

1. **SQL migration** → `scripts/<feature>_schema.sql` (run manually in Supabase dashboard)
2. **Server action** → `src/actions/<feature>.ts`
   ```ts
   "use server";
   import { createClient } from "@/lib/supabase/server";
   import { revalidatePath } from "next/cache";
   import { getSessionFromCookies } from "@/lib/auth/session";

   async function requireUser() {
     const session = await getSessionFromCookies();
     if (!session) throw new Error("Unauthorized access. Please log in.");
     const supabase = await createClient();
     return { supabase, userId: session.userId };
   }

   export async function createItem(data: CreateItemPayload) {
     const { supabase, userId } = await requireUser();
     const { data: item, error } = await supabase
       .from("table_name")
       .insert({ user_id: userId, ...data })
       .select().single();
     if (error) throw new Error(error.message);
     revalidatePath("/dashboard");
     revalidatePath("/feature-page");
     return item;
   }
   ```
3. **React Query hook** → `src/hooks/use<Feature>.ts`
   ```ts
   "use client";
   import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
   import { toast } from "sonner";

   export function useItems() {
     return useQuery({ queryKey: ["items"], queryFn: () => getItems() });
   }
   export function useCreateItem() {
     const qc = useQueryClient();
     return useMutation({
       mutationFn: (data: CreateItemPayload) => createItem(data),
       onSuccess: () => {
         qc.invalidateQueries({ queryKey: ["items"] });
         toast.success("Item added successfully");
       },
       onError: (e) => toast.error(e.message || "Failed to add item"),
     });
   }
   ```
4. **Page** → `src/app/(dashboard)/<feature>/page.tsx` (personal) or `src/app/(business)/business/<feature>/page.tsx`
   - `"use client"` on ALL interactive pages
   - Framer Motion page enter: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`
   - Skeleton while `query.isLoading`; Sonner toasts via hooks (not in components)
5. **Sidebar link** → `src/components/layout/sidebar.tsx` (personal) or `src/components/business/sidebar.tsx`
   - Add to `navItems` array: `{ name, href, icon, section }`
   - Personal sections: Overview, Finance, Planning, Tools
   - Also add route to `protectedRoutes` in `src/lib/supabase/middleware.ts`

---

## Auth — Two Separate Systems

### Personal Finance
- Cookie: `session_token` (HttpOnly JWT, 7-day)
- Session shape: `{ userId: string, email: string }`
- In server actions: define `requireUser()` inline (copy pattern above)

### Business
- Cookie: `business_session_token`
- Session shape: `{ userId, email, businessId, businessName, role, industry }`
- Roles: `owner | admin | member | sales`
- In server actions: `import { requireBusinessSession } from "@/actions/business-auth"` → `const { supabase, session } = await requireBusinessSession()`
- Scope all queries: `.eq("business_id", session.businessId)`
- Page guards (import from `@/lib/auth/guards`):
  - `requireSession()` — any logged-in business user
  - `requireNonSalesSession()` — owner/admin/member only (redirects sales → /business/sales)
  - `requireManagementSession()` — owner/admin only (redirects others → /business/dashboard)
  - `requireRetailAccess()` — retail industry only, all roles
  - `requireRetailSession()` — retail industry + non-sales
- Permission predicates: `canManage(role)` = owner|admin; `canWrite(role)` = !sales; `isSales(role)`
- Also add route to `businessProtectedRoutes` in `src/lib/supabase/middleware.ts`

---

## DB Tables — Personal Finance
`users`, `profiles` (monthly_budget), `expenses` (user_id, amount, major_category, category, description, expense_date),
`category_quotas` (user_id, category, monthly_limit — null=tracking only),
`weekly_budget_overrides` (user_id, week_start),
`expense_reimbursements` (user_id, person_name, amount, received_date),
`expense_subcategories` (user_id, name),
`incomes` (user_id, source, amount, income_date, is_recurring),
`savings` (user_id, name, target_amount, saved_amount, category, is_active),
`savings_transactions` (savings_id, user_id, amount, transaction_type, transaction_date),
`investments` (user_id, name, type, invested_amount, current_value, units, purchase_date, is_active),
`lendings` (user_id, person_name, amount, type[lent|borrowed], status[pending|partial|settled], settled_amount, due_date),
`lending_transactions` (lending_id, user_id, amount, transaction_date),
`ai_messages` (user_id, role, content, created_at),
`notes` (user_id, topic, content, color, pos_x, pos_y, rotation, z_index),
`password_reset_tokens`

## DB Tables — Business Module
`businesses` (id, name, industry, deleted_at),
`business_members` (business_id, user_id, role),
`business_expenses` (business_id, amount, category, status[pending|approved|rejected], submitted_by, approved_by),
`product_categories` (business_id, name),
`products` (business_id, category_id, name, cost_price, selling_price, is_active),
`inventory` (product_id, quantity),
`sales_transactions` (business_id, product_id, quantity, unit_price, total_amount, sold_by),
`customers` (business_id, name, phone, segment),
`catalogue_share_links` (business_id, token, expires_at)

---

## React Query Keys

**Personal finance:**
`expenses`, `budgetSummary`, `monthlyBudgetOverview`, `categorySpending`, `monthlyExpenseOverview`,
`userBudget`, `incomes`, `monthlyIncomeSummary`, `savingsGoals`, `savingsSummary`, `savingsTransactions`,
`investments`, `investmentSummary`, `lendings`, `lendingSummary`, `lendingTransactions`,
`moneyFlow`, `subcategories`, `notes`, `planner`, `reimbursements`, `aiMessages`

**Business:**
`businessExpenses`, `businessMembers`, `businessApprovals`, `businessAnalytics`,
`products`, `inventory`, `sales`, `customers`, `catalogueLinks`, `productMargins`

**Invalidation shortcuts:**
- Expense mutations → `expenses`, `budgetSummary`, `monthlyBudgetOverview`, `categorySpending`, `monthlyExpenseOverview`
- Budget mutations → above + `userBudget`, `moneyFlow`
- Income mutations → `incomes`, `monthlyIncomeSummary`, `moneyFlow`

---

## UI Conventions

- Components: shadcn/ui from `@/components/ui/*`
- Forms: React Hook Form + Zod — `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`
- Currency: `new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)`
- Toast: Sonner (`import { toast } from "sonner"`) — in hooks only, never in components
- Icons: Lucide React only (`import { IconName } from "lucide-react"`)
- Animations: Framer Motion. Page enter: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`. Staggered cards: `variants` with `staggerChildren`
- Theme: dark mode default. Use `text-muted-foreground`, `bg-muted/40`, `border-border`
- Overspent/error: `text-destructive`
- Progress: `<Progress value={pct} className="h-2" />`
- `"use client"` on ALL interactive pages (consistent throughout entire codebase)

---

## Key File Locations

| Path | Purpose |
|------|---------|
| `src/actions/` | Server actions (one file per domain) |
| `src/hooks/` | React Query hooks (one file per domain) |
| `src/app/(dashboard)/` | Personal finance pages |
| `src/app/(business)/business/` | Business module pages |
| `src/components/layout/sidebar.tsx` | Personal sidebar `navItems` array |
| `src/components/business/sidebar.tsx` | Business sidebar `getNavItems()` |
| `src/types/index.ts` | All shared TypeScript interfaces |
| `src/lib/auth/session.ts` | Personal JWT session |
| `src/lib/auth/business-session.ts` | Business JWT session |
| `src/lib/auth/guards.ts` | Business page guards |
| `src/lib/supabase/middleware.ts` | Route protection arrays |
| `scripts/` | SQL migration files |

---

## Important Gotchas

1. `major_category` on expenses: `"Daily Expense"` = default; user-defined category quotas become additional major categories
2. Budget tracking only counts `major_category = "Daily Expense"` expenses; quota categories tracked separately
3. `expense_reimbursements` reduces net Daily Expense spending in budget calculations
4. Business sidebar is role + industry gated — retail-only pages hidden for non-retail businesses
5. Sales role gets a restricted nav (only `/business/sales` page)
6. New personal routes need to be added to `protectedRoutes` array in `src/lib/supabase/middleware.ts`
7. New business routes need to be added to `businessProtectedRoutes` array in same file
8. Weekly carry-forward: past weeks use `override ?? baseBudget`; current+future weeks redistribute remaining / remaining days

---

## Working with Claude Code

**Structure prompts to skip exploration:**
```
Add a [feature name]. Follow CLAUDE.md standard pattern.
Table: `table_name`(col1 type, col2 type, ...)
Action file: src/actions/<name>.ts — operations needed: create, read, update, delete
Hook file: src/hooks/use<Name>.ts
Page: src/app/(dashboard)/<name>/page.tsx
Sidebar: add to [section] section, link to "/<route>"
UI: [brief description]
```

**Use `/compact` when:**
- After writing the server action file (before starting the hook)
- When switching feature domains mid-session
- After a debugging session, before the fix
- At the 80% mark of a large feature (after first 4 files done)

**Large features — 3-session split:**
1. Session 1: SQL migration + server action
2. Session 2: React Query hook + basic page (paste action function signatures, don't ask Claude to re-read)
3. Session 3: Polish, sidebar link, middleware route, charts
