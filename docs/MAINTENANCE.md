# Frogs & Friends Operations — Maintenance Guide

## Current architecture

The application is intentionally lightweight: static HTML/CSS/JavaScript hosted on Vercel, with Supabase providing authentication and database storage. GitHub is the source of truth and Vercel Preview Deployments are used to test changes before production.

## Development workflow

1. Make changes on a feature/preview branch.
2. Allow Vercel to create a Preview Deployment.
3. Test the relevant workflow using real application data.
4. Only merge to the production branch once the preview is approved.
5. Keep database schema changes as Supabase migrations so they remain auditable.

## Refactoring direction

The original incremental `app-1.js` … `app-9.js` files should be reorganised gradually rather than rewritten in one large change. Future maintenance should move functionality into clearly named modules:

- `modules/bookings.js`
- `modules/recurring-bookings.js`
- `modules/billing.js`
- `modules/reporting.js`
- `modules/school-dates.js`
- `modules/staff.js`
- `modules/shared/date.js`
- `modules/shared/money.js`
- `modules/shared/dom.js`

Feature behaviour should remain unchanged while code is moved.

## Styling direction

Avoid broad shared selectors for feature-specific layout. Prefer scoped classes such as `.billing-*`, `.recurring-*`, `.single-booking-*`, and `.school-events-*` so changes to one area do not unexpectedly affect another.

## Business rules that need automated tests

Priority calculations to cover with tests:

- recurring session generation by weekday and date range;
- breaks removing all affected sessions;
- individual cancellations removing only the selected dated session;
- free/internal use counting towards pool-use hours but not income;
- hourly rate × session duration;
- VAT calculations;
- monthly organisation statement totals;
- retrospective changes moving reviewed/approved statements to `adjustment_required`;
- forecast totals excluding breaks and cancellations.

## Data and audit rules

Financial approval history should never be silently overwritten. Any retrospective change after review or approval should create an audit event and require the statement to be reviewed again.

## Maintenance goal

Keep the user interface simple even as the application grows. Complex logic should be made easier to maintain internally without making staff workflows more complicated.
