# Folio — Product Admin Dashboard

A responsive Next.js, React, Tailwind CSS and Axios implementation of the supplied Frontend Assignment. Original visual design: warm neutrals, forest green accents, desktop tables and mobile product cards. The PDF has requirements but no visual reference to reproduce.

## Run locally

Use Node.js **22.13+ LTS** (recommended: latest Node 22 or 24).

```sh
npm ci --legacy-peer-deps
npm run dev
```

Open http://localhost:3000. No API keys or environment variables are required. Network access to https://dummyjson.com is required from the Next.js server; product images load from DummyJSON's CDN.

**Demo login:** `emilys` / `emilyspass`. The login page also has a button to fill the demo credentials.

```sh
npm run build
npm start
npm run typecheck
npm run lint
npm test
```

For browser tests, leave the app running on port 3000, install Playwright's browser once, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

The browser tests use the real DummyJSON service for authentication and product operations. The retry test intercepts a browser response to simulate an outage. Tests do not mutate the real dataset because DummyJSON simulates writes. Network outages may fail integration tests even when unit tests pass.

## Completed functionality

- Username/password login, incorrect-credential feedback, logout, server-protected pages and APIs.
- Product images, names, categories, prices, ratings and stock; desktop table and mobile cards.
- API pagination using `limit`/`skip`, page numbers, previous/next, sizes 10/20/50 and range counts.
- Debounced search using `/products/search?q=`, cancellation and late-response protection.
- Categories from `/products/categories`; sort by price, rating and title in either direction.
- URL state for page, page size, search, category and sort; invalid state normalization and out-of-range page repair.
- `/products/[id]` details, gallery, description, reviews and missing-product state.
- Validated add/edit forms; delete confirmation; success/error feedback and duplicate-submission locks.
- Persistent, user-scoped local overlay for simulated API mutations.
- Loading skeletons, empty results, recoverable errors and retry buttons.
- Shared Axios configuration, token injection upstream, and centralized error normalization.
- Keyboard-accessible dialogs, focus restoration, reduced motion, labeled controls and mobile navigation.
- Bonus: export the current page as CSV, with spreadsheet formula escaping.

## Architecture and decisions

### Authentication

The browser uses Axios to call same-origin `/api` handlers. Login forwards credentials to DummyJSON's `/auth/login`. The access token is placed in an **HTTP-only, SameSite=Lax cookie**, Secure in production, expiring after one hour. Tokens and passwords are never stored in localStorage or exposed to client components. Only a minimal user profile is serialized to the browser.

Every protected page, server layout and API request validates the token through `/auth/me`. The shared Axios factory attaches `Authorization: Bearer ...` to upstream calls. API routes allow only the assignment endpoints, check mutation origins, and validate mutation payloads. Expired/rejected sessions return to login. Network failures show a retry state rather than treating the user as logged out. A full navigation on API 401 clears protected client state. Logout clears the cookie; user-scoped catalog changes remain in this browser for the next login.

This is assignment authentication against a public demo service, not a production identity backend. No automatic refresh is implemented: the user signs in again after the one-hour session expires. The demo credentials are intentionally public.

### Search and category filtering

DummyJSON cannot combine server-side search with category filtering. This app deliberately makes them **mutually exclusive**: typing a search clears category; selecting a category clears search. An inline hint explains this behavior. It preserves accurate server totals and avoids filtering only the current page. When both are manually supplied in a URL, search takes precedence and the URL is normalized.

Search waits 350 ms. View state updates use Next.js-supported native history to avoid delayed server navigations overwriting newer typing. Each data effect owns an `AbortController` plus a current-request guard. A response for a previous query cannot replace a newer query's results. Add `?delay=2000` to test with DummyJSON's artificial delay (clamped to 0–5000 ms). Search, filter, sort and page-size changes reset page 1.

### Simulated writes and pagination

DummyJSON returns successful mutation responses but does not persist them. Writes must succeed upstream before being applied locally. A versioned localStorage workspace is scoped to authenticated user ID, with additions, updated product snapshots and deleted IDs. Storage failures are shown instead of falsely claiming a successful save. Local additions get unique timestamp IDs so DummyJSON's repeated synthetic ID cannot collide. Editing/deleting a local-only product operates on the overlay because no corresponding upstream resource exists.

**Before the first local mutation:** requests use only the requested server page (`limit` and `skip`).

**Once the workspace has mutations:** the app reads the baseline catalog in batches of 100, caches it for the mounted catalog, overlays changes, and then filters/sorts/paginates the reconciled result. This deliberate fallback avoids duplicates, empty gaps, incorrect totals, and edited products staying in the wrong category or sort position. Product details consult the overlay first. Changes survive refresh and navigation, but do not sync across devices or browsers. Changes in another tab trigger a reload to avoid stale state.

The fallback is appropriate for this small demo dataset. For a large production catalog, replace it with a persistent backend supporting consistent queries and mutations. Local search uses title, description and brand case-insensitively; DummyJSON's relevance behavior can differ slightly after switching to the reconciled catalog.

### UI and maintainability

Pages are thin route wrappers. API calls live in `src/lib/*-api.ts`, outside UI components. `src/lib/axios.ts` is the single Axios setup, used by browser and server clients. `query.ts` contains testable URL, merge, sort and pagination logic. Small shared components cover forms, dialogs, images, pagination and states. Tailwind CSS 4 is configured, with named CSS components for the custom visual system. No React Query, SWR, table or pagination library is used.

Summary cards explicitly say “Units on this page” so page-level values are not presented as global inventory statistics. Missing product images have a deliberate placeholder.

## Tests

Unit tests cover invalid URLs, normalization, search/category precedence, numeric and title sorting, merging additions/edits/deletions, empty and out-of-range pages, form validation, redirect safety, bearer headers and API errors.

Browser tests cover real login, wrong credentials, duplicate submissions, HTTP-only cookies, logout, route protection, pagination, sorting, filtering, debounced delayed searches, persistence, add/edit/delete, cancellation, details/reviews, invalid IDs, mobile overflow, recoverable API errors and invalid sessions.

## Implementation notes / code walkthrough

**Main problem:** a successful API write disappears on the next fetch because DummyJSON only simulates changes. A per-user overlay reconciled before sorting and pagination makes changes stable across the complete UI. Simply patching the current page would have broken counts and filtered views.

**Environment issue:** Turbopack's CSS worker could not bind its local port in the development environment. The scripts use Next.js's supported webpack builder, which does not depend on that worker path.

**AI assistance:** Codex assisted with requirement extraction, architecture, original visual design, implementation, tests and review. The project is intentionally split into straightforward modules for a live code walkthrough. Review the source and the decisions above before presenting it as your own work.

Suggested walkthrough: `server-auth.ts` and the API route → `axios.ts` → `products-api.ts` → `query.ts` → `workspace-provider.tsx` → `catalog.tsx` → the form/detail components → tests.

## Submission / deployment

The PDF asks for a public GitHub repository with incremental commits and a Vercel/Netlify live URL. Publishing destinations and account access are separate from implementation. Connect the completed repository to Vercel as a Next.js project, with `npm run build` as the build command. No secret environment variables are required. Do not export this as a static site: the authentication/API server routes are required.

- Public repository: not published yet.
- Live deployment: not published yet.
- Verification results: see `VERIFICATION.md` after the checks finish.

API references: [DummyJSON authentication](https://dummyjson.com/docs/auth), [DummyJSON products](https://dummyjson.com/docs/products).
