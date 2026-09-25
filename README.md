# Folio — Product Admin Dashboard

Folio is a product dashboard built for a frontend assignment using Next.js, React, Tailwind CSS and Axios. You can browse products, search the catalog, and try adding, editing or deleting items. It uses [DummyJSON](https://dummyjson.com) for product data and demo login.

The design uses warm neutral colors and green accents, with a table on desktop and product cards on smaller screens.

[Try the live demo](https://folio-product-admin.vercel.app) · [GitHub repository](https://github.com/khushichhetri71-tech/folio-product-admin)

## Try it out

Use these details to sign in:

- **Username:** `emilys`
- **Password:** `emilyspass`

There's also a button on the login page that fills these in for you.

## Run locally

You'll need Node.js **22.13 or newer** and an internet connection to reach DummyJSON and load product images. No API keys or environment variables are needed.

```sh
npm ci --legacy-peer-deps
npm run dev
```

Open [localhost:3000](http://localhost:3000) in your browser.

To run a production build locally:

```sh
npm run build
npm start
```

## What you can do

- Sign in and out, with helpful messages if login fails.
- Browse product images, prices, categories, ratings and stock.
- Search for products or filter by category, then sort by price, rating or name.
- Move between pages and choose 10, 20 or 50 products per page.
- Open a product to see its gallery, description and reviews.
- Add or edit products using forms that check your inputs, or delete a product after confirming.
- Export the current page as a CSV file.

Search, filters, sorting and page settings stay in the URL, so refreshing or sharing a link keeps the same view. The dashboard also includes loading placeholders, empty states and retry buttons when a request fails. Dialogs support keyboard navigation, and the layout works on mobile.

## A few things to know

### Product changes stay in your browser

DummyJSON accepts add, edit and delete requests, but it doesn't actually save the changes. Without extra handling, an edited product would go back to its original values on the next fetch.

To make the demo useful, Folio saves your changes in browser storage, separately for each user. Requests for existing products must succeed before changes are saved locally. Products you've added are managed locally after that.

Your changes survive refreshes and signing out, but they won't appear in another browser or on another device. If browser storage fails, the app shows an error. Changes made in another tab trigger a reload to keep the views in sync.

Before you make any changes, the app fetches one page at a time. After the first change, it fetches the catalog in batches and combines it with your saved changes before searching, sorting and splitting it into pages. This keeps counts and product positions consistent, including when you change a product's category or price.

That approach works for this small demo. A larger app would need a backend that saves changes. Local search checks the title, description and brand, so results can differ slightly from DummyJSON's search after you've made changes.

### Search and category filters work separately

DummyJSON doesn't support combining search and category filters in one request. Typing a search clears the selected category, and choosing a category clears the search. If a URL contains both, search takes priority.

Search waits 350 ms after you stop typing before sending a request. Older requests are cancelled or ignored so they can't replace newer results. Changing the search, category, sort order or page size takes you back to page 1.

To try a slower response, add `?delay=2000` to the catalog URL. The supported delay is between 0 and 5000 ms.

### Login lasts one hour

Login is handled through the app's server routes using DummyJSON's authentication API. The access token is kept in an HTTP-only cookie, which browser JavaScript can't read. Passwords and tokens aren't stored in localStorage.

Protected pages and API routes check the session with DummyJSON. When it expires, you'll need to sign in again; automatic token refresh isn't included. A network failure shows a retry option instead of immediately logging you out.

This is a demo login service with public credentials. It would need to be replaced for a production app.

## How the code is organized

The pages mostly bring components together. API requests and data handling live in separate files to keep the UI easier to follow.

| File | What it handles |
| --- | --- |
| `server-auth.ts` | Server-side login and session checks |
| `axios.ts` | Shared Axios setup for browser and server requests |
| `products-api.ts` | Product API calls |
| `query.ts` | URL settings, combining product changes, sorting and pagination |
| `workspace-provider.tsx` | Product changes saved in the browser |
| `catalog.tsx` | The main product listing |

Shared components handle forms, dialogs, images, pagination and loading or error states. The app uses Tailwind CSS 4 and doesn't use a separate table, pagination or data-fetching library.

The summary cards show values for the current page, rather than totals for the whole catalog. Missing images get a placeholder.

## Checks and tests

Run the code checks and unit tests with:

```sh
npm run typecheck
npm run lint
npm test
```

For browser tests, keep the app running on port 3000. Install Chromium once, then run the tests:

```sh
npx playwright install chromium
npm run test:e2e
```

Unit tests cover URL handling, sorting, pagination, saved product changes, form validation and authentication helpers. Browser tests cover login, protected pages, product browsing, search, add/edit/delete flows, saved changes, error recovery and the mobile layout.

Browser tests call the real DummyJSON service, so they need an internet connection and can fail if the service is unavailable. They don't change its dataset because DummyJSON only simulates writes. The retry test simulates a failed response to check error recovery.

See `VERIFICATION.md` for recorded check results.

## Deployment and development notes

The app can be deployed to Vercel as a Next.js project with `npm run build` as the build command. No secret environment variables are needed. It needs a server for authentication and API routes, so a static export won't work.

The development and build scripts use webpack because Turbopack's CSS worker couldn't open the local port it needed in the development environment.

Codex helped with planning, design, implementation, tests and review.

For more about the demo API, see the DummyJSON docs for [authentication](https://dummyjson.com/docs/auth) and [products](https://dummyjson.com/docs/products).
