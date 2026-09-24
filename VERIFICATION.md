# Verification

Verified locally on September 24, 2026 against the real DummyJSON service.

| Check                   | Result                                                       |
| ----------------------- | ------------------------------------------------------------ |
| TypeScript strict check | Passed                                                       |
| ESLint                  | Passed with no warnings                                      |
| Unit tests              | 42 passed across 3 test files                                |
| Browser scenarios       | All 6 passed in one production-mode run (47.6 seconds)       |
| Mobile layout           | 390px viewport, 390px document width; no horizontal overflow |
| Desktop layout          | Visually reviewed at 1440px                                  |
| Production build        | Passed (Next.js 16.3.6, webpack)                             |

## Browser coverage

1. Unauthenticated page/API protection, incorrect login, repeated login clicks, HTTP-only cookie and logout.
2. Pagination, rows per page, category filter, price sorting, empty search, invalid URL values, out-of-range page repair, refresh persistence and delayed overlapping searches.
3. Add validation, repeated save clicks, local product persistence, editing, delete cancellation and deletion.
4. Existing API product PUT/DELETE requests, changed-category membership, sorted order, corrected totals and refresh persistence.
5. Product imagery and reviews, missing/invalid IDs, mobile cards and navigation.
6. Simulated service failure, retry recovery and invalid-token rejection.

## Bugs found and fixed during verification

- Prevented pre-hydration login submissions from using native GET navigation; inputs and submission are disabled until React is ready, and the form specifies POST.
- Made the edit-category control controlled, so asynchronous category options cannot reset it.
- Replaced delayed router navigation for view-state changes with Next.js-supported native history updates, and prevented query acknowledgements from overwriting newer typed search input.
- Validated stored workspace records before rendering them.
- Added session verification at each protected page boundary as well as the layout and every API request.

## Evidence

Screenshots are stored locally under `artifacts/` (excluded from Git): desktop catalog, mobile catalog, login and product detail. Playwright saves traces/screenshots for any failing tests in `test-results/` (also excluded).

The checks demonstrate the tested flows; they do not guarantee absence of every possible defect. Live API availability is an external dependency. DummyJSON writes are simulated and reconciled locally, as documented in README.md. The source is published at [khushichhetri71-tech/folio-product-admin](https://github.com/khushichhetri71-tech/folio-product-admin). A live deployment is still pending.
