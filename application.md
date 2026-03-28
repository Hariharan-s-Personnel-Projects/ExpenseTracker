# Tracker AI — Complete Application Features & Functionality

## 1. Authentication System

### Email/Password Auth

- **Sign Up** — email + password (min 6 chars), duplicate email check, password hashed with HMAC-SHA256 (`AUTH_SECRET`), default profile created on registration
- **Login** — email + password validation, JWT session (HS256, 7-day expiry) stored in `session_token` HttpOnly cookie
- **Logout** — server action clears session cookie, redirects to login
- **Update Password** — change password for email users (requires current password verification)
- **Set Password** — Google-only users can add a password to their account (converts them to dual-auth)

### Google OAuth

- **Google Sign In** — redirects to Google OAuth consent screen, CSRF-protected via random `state` cookie
- **Google Sign Up** — creates new user tagged `is_google: true`, auto-generated random password hash stored
- **Google Callback** (`/api/auth/google/callback`) — state verification, exchanges OAuth code for tokens, fetches Google user info, handles 4 flows: login-existing, login-new, signup-new, signup-existing
- **Intent tracking** — `google_oauth_intent` cookie distinguishes login vs. signup flows

### Password Reset

- **Forgot Password** — sends branded HTML email via Gmail API with HMAC-SHA256 hashed token (configurable expiry, default 5 min)
- **Verify Reset Token** — validates token hash, expiry, and one-time-use status before showing form
- **Reset Password** — token re-verified on submit, password updated, token marked as `used`
- **Anti-enumeration protection** — always returns `success: true` even when email is not found

### Middleware Route Protection

- Protected routes: `/dashboard`, `/expenses`, `/add-expense`, `/ai-assistant`, `/settings`, `/income`, `/savings`, `/investments`, `/lending`, `/money-flow`, `/budget`
- Unauthenticated users redirected to `/login?redirect=<path>`
- Authenticated users redirected away from `/login` and `/signup` to `/dashboard`

---

## 2. Expense Management (CRUD)

### Data Model

- Fields: `id`, `user_id`, `amount` (NUMERIC, INR), `major_category`, `category`, `description`, `expense_date`, `created_at`
- **Major Category**: top-level bucket (`Daily Expense` or a custom category quota name like `Learning`, `Miscellaneous`)
- **Category**: sub-category free text (e.g., `Coffee`, `Groceries`, `Books`)

### Operations

- **Create** — form with amount (₹), major category dropdown, sub-category (with history-based autocomplete), description, date; Zod validation; cache revalidation on success
- **Read** — fetch all expenses ordered by date descending; displayed in paginated table
- **Update** — inline edit dialog on Expenses page; category input shows autocomplete suggestions with match highlighting
- **Delete** — delete button with `isPending` loading state
- **Search / Filter** — client-side search by description, category, and major category

### UPI Integration

- After adding an expense, optional "Pay with App" checkbox triggers `upi://pay?am=…&cu=INR&tn=…` deep link, opening the user's UPI app with amount pre-filled

---

## 3. Budget Management

### Monthly Budget

- Set in Settings (stored on `profiles.monthly_budget`)
- Currency: INR
- Editable on the Budget & Quotas page

### Calendar-Based Weekly Splitting

- Month split into calendar weeks (partial first/last weeks handled proportionally)
- Formula: `Weekly Budget = (Monthly Budget / Total Days in Month) × Days in Week`
- Default week start: **Monday**

### Carry-Forward Logic

- Past weeks: `effectiveBudget = overrideBudget ?? baseBudget`
- Current + future weeks: remaining budget redistributed across remaining days
  - `newDailyBudget = remainingBudget / remainingDays`
  - `effectiveBudget = newDailyBudget × daysInWeek`
- Overspending automatically reduces future week allocations

### Weekly Budget Overrides

- Any week's budget can be manually overridden (inline edit on Budget page)
- Overrides persist to `weekly_budget_overrides` table (upsert on `user_id, week_start`)
- Override badge shown in UI; can be reset to auto-calculated value

### Budget Dashboard Card

- Shows: spent this week, weekly limit (with carry-forward), remaining amount, progress bar, % used, alert icon at >85% usage, dynamic daily budget

---

## 4. Category Quota System

### Category Quotas

- User defines monthly spending limits per custom category (e.g., `Learning: ₹2000`)
- Stored in `category_quotas` table (upsert on `user_id, category`)
- Full CRUD: add with name + limit, view all, delete

### Category Spending Tracking

- Monthly spending aggregated by `major_category` and compared to quotas
- `CategorySpending` type: `{ category, monthlyLimit, spent, remaining, percentage }`

### Dashboard Category Quota Card

- Shows all quotas with progress bars, spent/limit amounts, remaining balance
- Overspent categories shown in red (`text-destructive`)
- Empty state links to Budget & Quotas page

### Add Expense Integration

- Major category dropdown dynamically populated from `Daily Expense` + all user-defined category quotas
- Non-Daily-Expense selections auto-set the sub-category to match the major category

---

## 5. Income Tracking

### Data Model

- Table: `incomes` — Fields: `id`, `user_id`, `source`, `amount`, `income_date`, `is_recurring`, `notes`, `created_at`
- Sources: Salary, Freelance, Side Hustle, Rental, Dividends, Interest, Business, Gift, Other

### Operations

- **Create** — form with amount (₹), source dropdown, date, notes, recurring checkbox; Zod validation
- **Read** — fetch all incomes ordered by date descending
- **Update** — edit dialog with all fields
- **Delete** — delete button per entry

### Monthly Income Summary

- Total income for current month, breakdown by source with percentages
- Recurring vs one-time income split
- Visual progress bars per source

### Income Page (`/income`)

- Summary cards: Total Income, Recurring Income, Active Sources
- Add income form with source selector
- Income breakdown by source (progress bars)
- Full income list with edit/delete

---

## 6. Savings Tracking

### Data Model

- Table: `savings` — fields: `id`, `user_id`, `name`, `target_amount`, `saved_amount`, `category`, `is_active`, `created_at`
- Table: `savings_transactions` — fields: `id`, `savings_id`, `user_id`, `amount`, `transaction_type` (deposit/withdrawal), `notes`, `transaction_date`, `created_at`
- Categories: General, Emergency, Retirement, Goal-Based

### Operations

- **Create Goal** — name, target amount, category
- **Add Funds** — deposit or withdraw to/from any goal; auto-updates `saved_amount`
- **Delete Goal** — cascades to delete all transactions
- **Summary** — total saved, total targets, active goals, completed goals, overall progress %

### Savings Page (`/savings`)

- Summary cards: Total Saved, Active Goals, Overall Progress
- New goal form
- Goal cards with progress bars, completion status, add-funds button
- Transaction dialog for deposits/withdrawals

---

## 7. Investment Tracking

### Data Model

- Table: `investments` — fields: `id`, `user_id`, `name`, `type`, `invested_amount`, `current_value`, `units`, `purchase_date`, `notes`, `is_active`, `created_at`
- Types: Stocks, Mutual Funds, FD, PPF, Gold, Crypto, Real Estate, Other

### Operations

- **Create** — name, type, invested amount, current value, units, purchase date, notes
- **Update** — edit all fields (especially current value for portfolio updates)
- **Delete** — remove investment record
- **Summary** — total invested, total current value, total returns, return %, breakdown by type

### Investments Page (`/investments`)

- Summary cards: Total Invested, Current Value, Returns (₹ and %), color-coded green/red
- Portfolio breakdown by type with return percentages
- Add investment form
- Full investment list with inline returns display, edit/delete

---

## 8. Lending & Borrowing Tracker

### Data Model

- Table: `lendings` — fields: `id`, `user_id`, `person_name`, `amount`, `type` (lent/borrowed), `status` (pending/partial/settled), `settled_amount`, `due_date`, `notes`, `created_at`
- Table: `lending_transactions` — fields: `id`, `lending_id`, `user_id`, `amount`, `transaction_date`, `notes`, `created_at`

### Operations

- **Create** — record money lent or borrowed with person name, amount, type, due date, notes
- **Record Repayment** — add partial repayment; auto-updates `settled_amount` and `status`
- **Delete** — remove lending record
- **Summary** — total lent/borrowed, pending amounts, settled amounts

### Status System

- `pending` — no repayment yet
- `partial` — some amount repaid
- `settled` — fully repaid (auto-set when settled_amount >= amount)

### Overdue Detection

- Records with due_date in the past and status not settled show "Overdue" badge

### Lending Page (`/lending`)

- Summary cards: Total Lent, Total Borrowed, Settled Lent, Settled Borrowed
- New record form with lent/borrowed toggle
- Filter tabs: All, Lent, Borrowed
- Record list with status badges, progress bars, repayment button, overdue alerts

---

## 9. Money Flow Overview

### Data Aggregation

- Server action fetches all income, expenses, savings transactions, investments, and lending data for current month
- Parallel queries for optimal performance

### MoneyFlowSummary

- `totalIncome`, `totalExpenses`, `totalSavings`, `totalInvested`, `netLending`, `netCashFlow`
- `netCashFlow = income - expenses - savings - investments`

### Money Flow Page (`/money-flow`)

- 6 key metric cards: Income, Expenses, Savings, Investments, Lent (net), Net Cash Flow
- **Visual Sankey Flow** — animated bar chart showing income distribution:
  - Income bar (100%)
  - Distribution bars: Expenses, Savings, Investments, Lent (net), Unallocated
  - Each with percentage and amount
- **Savings Rate** — % of income going to savings + investments
- **Expense Ratio** — % of income spent on expenses (color-coded: green < 70%, red > 70%)
- Contextual alerts for overspending or positive cash flow

### Dashboard Integration

- **Finance Overview Card** on dashboard — compact 6-metric grid showing monthly financial snapshot
- Links to full Money Flow page

---

## 10. AI Assistant

### Chat Interface

- Full-screen chat UI (WhatsApp-style header, message bubbles, auto-scroll to bottom)
- Powered by **Groq AI** (`@ai-sdk/groq`) via streaming API route (`/api/chat`)
- Uses `useChat` from `@ai-sdk/react` with streaming status awareness (`submitted`, `streaming`, `ready`)

### AI Context Injection

- Every request pre-fetches user's full financial data and injects as system prompt:
  - Monthly budget, weekly limit, spent this week/month, remaining
  - This month's spending by category
  - Top expense categories (last 50 expenses)
  - Last 20 expenses with IDs, dates, categories, descriptions, amounts

### AI Tool Capabilities

- The AI can directly perform actions using Vercel AI SDK tool calls
- Conversation history persisted to `ai_messages` table (both user and assistant messages)

### Chat History

- Loaded from DB on page open via `getChatHistory()`; mapped to `UIMessage` format
- `clearChatHistory()` deletes all DB records and resets UI to welcome message

### Quick Actions

- 3 preset quick-action chips: "Log an expense", "Check my budget", "View my expenses"
- Clicking sends the prompt directly

### AI Quick Input (Dashboard)

- Compact input bar on the dashboard
- Submitting redirects to `/ai-assistant?prompt=<text>`, which auto-sends the message on load

---

## 11. Data Visualizations (Charts)

All charts use **Recharts** with an indigo/violet color palette and custom tooltips.

| Chart                        | Type                          | Data                                                                | Location  |
| ---------------------------- | ----------------------------- | ------------------------------------------------------------------- | --------- |
| **Weekly Spending**          | Area chart with gradient fill | Daily spend for last 7 days                                         | Dashboard |
| **Monthly Breakdown**        | Donut (Pie) chart             | Spending by category this month, % shares, center total             | Dashboard |
| **Monthly Spending by Week** | Bar chart                     | Weekly totals for current month, gradient bars                      | Dashboard |
| **Spending by Category**     | Multi-line chart              | Per-category daily spend last 7 days, one line per category, legend | Dashboard |

- All charts show skeleton loaders while data is fetching
- All charts show empty-state messages when no data exists

---

## 12. Pages & Navigation

### Dashboard (`/dashboard`)

Layout: AI quick input → **Finance Overview Card** (6-metric snapshot) → Budget card + Category quota card (2-col grid) → Monthly pie chart + 7-day area chart (2-col) → Monthly weekly bar chart → Category line chart → Recent 5 expenses table

### Add Expense (`/add-expense`)

Form fields: amount, major category (dynamic dropdown), sub-category (autocomplete from history), description, date, UPI pay toggle

### Expenses (`/expenses`)

- Full paginated table of all expenses
- Search bar (filters by description/category/major category)
- Inline edit dialog
- Delete button with loading state
- Horizontal scroll for mobile (`min-w-[700px]`)

### Budget & Quotas (`/budget`)

- **Monthly Budget Input** — set monthly total budget
- **Weekly Breakdown Table** — week number, date range, days, base budget, effective budget (inline editable, custom badge, reset button), spent, remaining, progress bar; current week highlighted
- **Carry Forward Summary Cards** — monthly budget, total spent, total remaining, dynamic daily budget
- **Category Quota Manager** — add/view/delete quotas with live spending vs. limit progress bars

### AI Assistant (`/ai-assistant`)

Full-screen streaming chat with history persistence, clear history button, quick action chips, auto-send from URL query param (`?prompt=`)

### Settings (`/settings`)

- Password change (email users: requires current password)
- Set password (Google users: one-way upgrade to dual-auth)
- Auth type detection via `getUserAuthInfo()`

---

## 13. Marketing / Public Pages

### Landing Page (`/`)

- Animated particle field background
- 3D tilt feature cards with spring physics mouse-tracking
- Animated counters
- Feature grid (AI, Budget, Charts, Security)
- Feature highlights with icons: Bot, Wallet, TrendingUp, Cpu, PieChart, Fingerprint, ShieldCheck, Zap
- Hero CTA with animations
- Public navbar with links to Features, Pricing, Login, Sign Up

### Features Page (`/features`)

- Marketing page detailing app capabilities

### Pricing Page (`/pricing`)

- Marketing page with pricing/plan information

---

## 14. State Management

| Store             | Library | State Managed                                                          |
| ----------------- | ------- | ---------------------------------------------------------------------- |
| `useSidebarStore` | Zustand | `isOpen`, `toggle()`, `open()`, `close()` — mobile sidebar drawer      |
| `useExpenseStore` | Zustand | `expenses[]`, `monthlyBudget`, `isLoading` — client-side expense cache |

---

## 15. Data Fetching (React Query)

All server interactions go through React Query mutations/queries for caching and cache invalidation.

**Expense hooks**: `useExpenses`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`, `useBudgetSummary`, `useUserBudget`, `useUpdateBudget`

**Budget hooks**: `useMonthlyBudgetOverview`, `useSetWeeklyOverride`, `useRemoveWeeklyOverride`, `useCategoryQuotas`, `useUpsertCategoryQuota`, `useDeleteCategoryQuota`, `useCategorySpending`, `useMonthlyExpenseOverview`

**Income hooks**: `useIncomes`, `useCreateIncome`, `useUpdateIncome`, `useDeleteIncome`, `useMonthlyIncomeSummary`

**Savings hooks**: `useSavingsGoals`, `useSavingsSummary`, `useSavingsTransactions`, `useCreateSavingsGoal`, `useUpdateSavingsGoal`, `useDeleteSavingsGoal`, `useAddSavingsTransaction`

**Investment hooks**: `useInvestments`, `useInvestmentSummary`, `useCreateInvestment`, `useUpdateInvestment`, `useDeleteInvestment`

**Lending hooks**: `useLendings`, `useLendingSummary`, `useLendingTransactions`, `useCreateLending`, `useUpdateLending`, `useDeleteLending`, `useAddLendingTransaction`

**Money Flow hooks**: `useMoneyFlowSummary`

On any mutation success, related query keys are invalidated to keep all views in sync.

---

## 16. UI / Design System

- **Component library**: shadcn/ui — Button, Card, Input, Label, Dialog, Table, Badge, Progress, Skeleton, Checkbox, Avatar, DropdownMenu, Sonner toast
- **Styling**: Tailwind CSS v4 with `class-variance-authority`
- **Animations**: Framer Motion — page enter animations, sidebar spring animation, staggered card reveals, glow-pulse background orbs, particle field
- **Theme**: Dark mode default with `next-themes`; theme toggle in sidebar; ambient background glow orbs on all dashboard pages
- **Font**: Inter (Google Fonts)
- **Toast notifications**: Sonner — success/error for all CRUD operations
- **Form validation**: React Hook Form + Zod with `zodResolver`
- **Currency**: Indian Rupee (₹), `en-IN` locale formatting throughout

---

## 17. Backend / Infrastructure

### Database (Supabase + PostgreSQL)

**13 tables:**

| Table                     | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `users`                   | Core user accounts (email, password hash, is_google flag) |
| `profiles`                | User profile data (monthly_budget, currency)              |
| `expenses`                | All expense records                                       |
| `ai_messages`             | AI chat history per user                                  |
| `weekly_budget_overrides` | Per-user per-week manual budget overrides                 |
| `category_quotas`         | Per-user monthly category spending limits                 |
| `password_reset_tokens`   | One-time tokens for password reset flow                   |
| `incomes`                 | Income records with source, amount, recurring flag        |
| `savings`                 | Savings goals with target/saved amounts                   |
| `savings_transactions`    | Deposits/withdrawals for savings goals                    |
| `investments`             | Investment portfolio (stocks, MF, FD, crypto, etc.)       |
| `lendings`                | Money lent to or borrowed from people                     |
| `lending_transactions`    | Partial repayment records for lending entries             |

**Performance indexes on**: `expenses(user_id, expense_date)`, `expenses(user_id, category)`, `ai_messages(user_id, created_at)`, `users(email)`, `weekly_budget_overrides(user_id, week_start)`, `category_quotas(user_id)`, `password_reset_tokens(token_hash)`

### Custom Authentication (Not Supabase Auth)

- Custom `users` table; Supabase is used only as a database, not for its auth module
- JWT signing/verification via `jose` library
- Session cookie: `session_token`, HttpOnly, SameSite=Lax, 7-day expiry

### Email (Gmail API)

- OAuth2 via `googleapis` with refresh token
- Branded HTML email template for password reset
- Configurable token expiry via `RESET_TOKEN_EXPIRY_MINUTES` env var

### Setup Diagnostic Endpoint (`/api/setup`)

- Tests Supabase connection and confirms `users` table exists
- Provides actionable error messages for developers during setup

### Proxy (`src/proxy.ts`)

- Development proxy utility

---

## 18. Key Dependencies

| Package                          | Purpose                       |
| -------------------------------- | ----------------------------- |
| `next` (v16)                     | App framework (App Router)    |
| `react` (v19)                    | UI library                    |
| `@supabase/ssr`                  | Supabase client for SSR       |
| `@ai-sdk/groq` + `@ai-sdk/react` | Groq AI streaming chat        |
| `recharts`                       | Data visualization charts     |
| `framer-motion`                  | Animations and transitions    |
| `react-hook-form` + `zod`        | Form handling and validation  |
| `zustand`                        | Client-side state management  |
| `@tanstack/react-query`          | Server state caching/fetching |
| `date-fns`                       | Date manipulation utilities   |
| `jose`                           | JWT signing and verification  |
| `googleapis`                     | Gmail API for email sending   |
| `sonner`                         | Toast notifications           |
| `next-themes`                    | Dark/light theme management   |
