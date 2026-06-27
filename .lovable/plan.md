# Phase 4 — Complete Accounting Build

Large multi-step build. Will deliver in this order:

## 1. SQL migration (you run it)
- Seed full **Chart of Accounts** (1000–6999, all 6 categories in Bengali)
- Create `analytic_plans` + `analytic_accounts` tables (BRANCH, COST_CENTER, PROJECT, PRODUCT_CATEGORY)
- Seed 4 plans + cost centers + auto-link branches → analytic_accounts (BRANCH plan, with `linked_branch_id`)
- Trigger: new branch → auto-create analytic_account
- Seed 7 journals (Sales, Purchase, Cash, Bank, General, Contra, Adjustment)
- Seed Bangladesh FY 2025–26 (July→June) with 12 monthly periods, current month `open`
- `get_branch_pnl(branch_id, start, end)` function returning income/expense rows
- Add `analytic_account_id` column to `journal_lines` for cost center/project tagging

## 2. Frontend utilities
- `src/lib/bn.ts` — add `formatBDT()` with lakh/crore comma formatting + ৳ symbol
- `src/lib/analytic.ts` — hooks for analytic plans/accounts
- `src/lib/pnl.ts` — hook calling `get_branch_pnl` RPC

## 3. New pages
- `/accounting` — overview rebuilt with **real data**: total assets/liabilities, this month's income/expense, net profit, unposted count, 6-month income vs expense Recharts bar chart, all filtered by current branch
- `/accounting/accounts` — **tree-view CoA** with collapsible groups, type-colored left borders, balance per node (from journal_lines), category filter tabs, search, add/edit modal with dimension switches + opening balances
- `/accounting/entries/new` — **full-page** journal entry form: header card + spreadsheet-like lines grid with account autocomplete, debit/credit, cost center, project; live totals footer with balanced/unbalanced indicator; Save Draft / Post buttons
- `/accounting/entries/$id` — view/edit (edit only if draft); cancel with reason for posted
- `/accounting/analytic` — tabs (Branch read-only / Cost Center / Project / Product Category) with CRUD
- `/accounting/branch-pnl` — filters card (branch, date range) + report output with income/expense breakdown, net profit/loss styled, PDF/Excel export buttons (stub for now)

## 4. UI polish per spec
- Account code pills (monospace), debit blue / credit teal, balanced ✅ / unbalanced ❌ indicators, entry number monospace, BDT formatting everywhere

## Technical notes
- All queries filter by `currentBranch` from `BranchContext`
- Balance per account = `sum(debit) - sum(credit)` from posted `journal_lines` (sign-adjusted by category)
- Period must be `open` to enable Post button
- Posted entries immutable; cancellation creates reverse entry (DB function)
- Existing `/accounting/journals` and `/accounting/periods` pages stay; sidebar reorganized to match spec

## Out of scope (defer)
- Actual PDF/Excel export wiring (buttons present, toast "শীঘ্রই")
- Automatic reverse entry on cancel — DB function exists, UI just calls cancel for now

After you approve, I'll write the migration SQL first for you to run, then ship the frontend in one pass.
