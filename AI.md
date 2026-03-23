So my application is called Tracker AI

This application gets the total expense for a month and splits the expense into weekly quotas and allows u to log your expense and it tracks what is the current expense and how much can u spend for the rest of the week

so treat this as weekly daily expense as a category, so it should be split by the week
I want to give a monthly total amount to be spent and it should divide it among the weeks of the month automatically

Also make it editable for each weekly quota editable and if I spend less for this week, it should be carry forward to next week

Add this edit options and the Total amount from the settings to a new tab in the application

I want a new feature like add quotas for the category like learning and misileanious expense and try to log all the expenses that goes out of my pocket

## Refine Prompt
🎯 Objective

Enhance the application to support:

1. Monthly budget allocation → automatic weekly distribution
2. Real-time expense tracking against weekly limits
3. Category-based quota management
4. Carry-forward logic for unused budget
5. Editable budget controls via a dedicated settings tab

1. Monthly Budget Input
User provides a total monthly budget
This value is stored in Settings → Budget Configuration

2. Automatic Weekly Allocation
The system must:
Split the monthly budget into calendar-based weeks
Weeks must follow:
Default: Monday–Sunday
Configurable option (e.g., Sunday–Saturday)
Ensure:
All days in the month are covered
Partial weeks (start/end of month) are handled proportionally

✅ Example:

Month: April
Week 1: Apr 1–Apr 6 (partial week)
Week 2+: Full weeks

3. Weekly Budget Calculation Logic
Default distribution:
Equal split OR proportional by number of days in that week
Formula (recommended):
`Weekly Budget = (Monthly Budget / Total Days in Month) × Days in Week`

4. Carry Forward Logic
If weekly spending < allocated budget:
Remaining amount is added to next week
If overspent:
Next week’s available budget is reduced
`Next Week Budget = Base Weekly Budget + Carry Forward`

5. Carry Forward Logic

If weekly spending < allocated budget:
Remaining amount is redistributed across all remaining days of the month

If overspent:
Deficit amount is distributed across all remaining days, reducing future budgets

New Daily Budget = (Monthly Budget − Total Spent So Far) / Remaining Days

Next Week Budget = New Daily Budget × Days in that week

6. Editable Weekly Quotas
User must be able to:
Override any weekly budget manually
Edits should:
Persist in DB
Override auto-calculated value
Still respect carry-forward adjustments

7. Category-Based Quotas
User can define monthly category limits, e.g.:
Learning: ₹2000
Miscellaneous: ₹3000
System should:
Track category-wise spending
Show:
Remaining quota
% usage

9. New UI Tab: “Budget & Quotas”

Create a dedicated tab with:

Sections:

Monthly Budget Input
Weekly Budget Breakdown (Editable)
Carry Forward Summary
Category Quotas Management

10. Update the Dashboard
create new display charts for each cateogry and create a overall expense cateogory chart that shows the overall expense of the month