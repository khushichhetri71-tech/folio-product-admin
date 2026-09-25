'use client';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Boxes,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
  X,
  ArrowDownUp,
  Package,
  Download,
  Info,
} from 'lucide-react';
import type { Category, Product, ProductPage, Query } from '@/lib/types';
import { getAllProducts, getCategories, getProducts } from '@/lib/products-api';
import { errorMessage } from '@/lib/axios';
import { mergeProducts, parseQuery, queryString, selectProducts, sorts } from '@/lib/query';
import { useWorkspace } from './workspace-provider';
import { ErrorState, EmptyState, TableSkeleton } from './states';
import { ProductTable } from './product-table';
import { Pagination } from './pagination';
import { ProductForm } from './product-form';
import { DeleteDialog } from './delete-dialog';
function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [text, setText] = useReducer((_: string, v: string) => v, value);
  const callback = useRef(onChange);
  const submitted = useRef<string | null>(null);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  useEffect(() => {
    // An acknowledgement of our own debounced update must not replace newer typing.
    if (submitted.current === value) {
      submitted.current = null;
      return;
    }
    setText(value);
  }, [value]);
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => {
      submitted.current = text.trim();
      callback.current(text.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [text, value]);
  return (
    <div className="search-input">
      <Search size={18} />
      <input
        aria-label="Search products"
        placeholder="Search products…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={200}
      />
      {text && (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => {
            submitted.current = '';
            setText('');
            callback.current('');
          }}
        >
          <X size={15} />
        </button>
      )}
      <kbd>/</kbd>
    </div>
  );
}
type LoadState = { data: ProductPage | null; loading: boolean; error: string; key: string };
export function Catalog() {
  const params = useSearchParams(),
    router = useRouter();
  const raw = params.toString();
  const query = useMemo(() => parseQuery(new URLSearchParams(raw)), [raw]);
  const normalized = queryString(query);
  const { changes, ready, notify } = useWorkspace();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [reload, retry] = useReducer((n) => n + 1, 0);
  const [load, setLoad] = useReducer((_: LoadState, next: LoadState) => next, {
    data: null,
    loading: true,
    error: '',
    key: '',
  });
  const [editing, setEditing] = useState<Product | true | null>(null),
    [deleting, setDeleting] = useState<Product | null>(null);
  const base = useRef<Product[] | null>(null);
  const hasChanges =
    changes.added.length > 0 ||
    Object.keys(changes.updated).length > 0 ||
    changes.deleted.length > 0;
  const navigate = useCallback((patch: Partial<Query>) => {
    const next = { ...parseQuery(new URLSearchParams(window.location.search)), ...patch };
    const qs = queryString(next);
    // These are client-side view options. Native history integrates with useSearchParams
    // without a delayed server navigation overwriting a more recent search.
    window.history.replaceState(null, '', `/products${qs ? '?' + qs : ''}`);
  }, []);
  useEffect(() => {
    if (raw !== normalized)
      window.history.replaceState(null, '', `/products${normalized ? '?' + normalized : ''}`);
  }, [raw, normalized]);
  useEffect(() => {
    const c = new AbortController();
    getCategories(c.signal)
      .then((data) => {
        setCategories(data);
        setCategoryError('');
      })
      .catch((e) => {
        if (!c.signal.aborted) setCategoryError(errorMessage(e));
      });
    return () => c.abort();
  }, [reload]);
  useEffect(() => {
    if (query.category && categories.length && !categories.some((c) => c.slug === query.category))
      navigate({ category: '', page: 1 });
  }, [categories, query.category, navigate]);
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[aria-label="Search products"]')?.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const c = new AbortController();
    let current = true;
    setLoad({ data: null, loading: true, error: '', key: normalized });
    async function loadData() {
      try {
        let data: ProductPage;
        if (hasChanges) {
          if (!base.current) base.current = await getAllProducts(c.signal);
          data = selectProducts(mergeProducts(base.current, changes), query);
        } else data = await getProducts(query, c.signal);
        if (!current) return;
        const max = Math.max(1, Math.ceil(data.total / query.size));
        if (query.page > max) {
          navigate({ page: max });
          return;
        }
        setLoad({ data, loading: false, error: '', key: normalized });
      } catch (e) {
        if (current && !c.signal.aborted)
          setLoad({ data: null, loading: false, error: errorMessage(e), key: normalized });
      }
    }
    void loadData();
    return () => {
      current = false;
      c.abort();
    };
  }, [ready, hasChanges, changes, query, normalized, reload, navigate]);
  function exportPage() {
    if (!load.data) return;
    const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      ['ID', 'Title', 'Category', 'Price (INR)', 'Rating', 'Stock'],
      ...load.data.products.map((p) => [p.id, p.title, p.category, p.price, p.rating, p.stock]),
    ]
      .map((row) =>
        row.map((v) => escape(typeof v === 'string' && /^[=+@-]/.test(v) ? `'${v}` : v)).join(','),
      )
      .join('\r\n');
    const url = URL.createObjectURL(
      new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio-products-page-${query.page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('This page has been exported as a CSV.');
  }
  const busy = load.loading || load.key !== normalized;
  const data = busy ? null : load.data;
  const pageStock = data?.products.reduce((sum, p) => sum + p.stock, 0);
  const pageLow = data?.products.filter((p) => p.stock < 10).length;
  const filtered = !!(query.q || query.category);
  return (
    <div className="catalog-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR CATALOG, AT A GLANCE</span>
          <h1>
            Products<span className="heading-dot">.</span>
          </h1>
          <p>A little organization. A lot of potential.</p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            onClick={exportPage}
            disabled={!data?.products.length}
          >
            <Download size={16} />
            Export page
          </button>
          <button className="button primary" onClick={() => setEditing(true)}>
            <Plus size={18} />
            Add product
          </button>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <span>{filtered ? 'Matching products' : 'Catalog products'}</span>
            <strong>{data ? data.total.toLocaleString() : '—'}</strong>
            <p>{filtered ? 'In your current selection' : 'Ready for their next chapter'}</p>
          </div>
          <span className="stat-icon green">
            <Package size={22} />
          </span>
        </div>
        <div className="stat-card">
          <div>
            <span>Categories</span>
            <strong>{categories.length || '—'}</strong>
            <p>A place for every product</p>
          </div>
          <span className="stat-icon lavender">
            <Tags size={22} />
          </span>
        </div>
        <div className="stat-card">
          <div>
            <span>Units on this page</span>
            <strong>{pageStock?.toLocaleString() ?? '—'}</strong>
            <p>
              {data
                ? `${pageLow} ${pageLow === 1 ? 'product needs' : 'products need'} a stock check`
                : 'Keeping your inventory in view'}
            </p>
          </div>
          <span className="stat-icon sand">
            <Boxes size={23} />
          </span>
        </div>
      </div>
      <section className="catalog-panel" aria-label="Product catalog">
        <div className="panel-heading">
          <div className="panel-title">
            <h2>All products</h2>
            <span className="count-tag">{data?.total ?? '…'}</span>
          </div>
          <span className="panel-note">
            <span /> Your catalog, in one place
          </span>
        </div>
        <div className="toolbar">
          <SearchField value={query.q} onChange={(q) => navigate({ q, category: '', page: 1 })} />
          <div className="filter-controls">
            <div className="select-wrap">
              <SlidersHorizontal size={16} />
              <select
                aria-label="Filter by category"
                value={query.category}
                onChange={(e) => navigate({ category: e.target.value, q: '', page: 1 })}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="select-wrap sort-select">
              <ArrowDownUp size={16} />
              <select
                aria-label="Sort products"
                value={query.sort}
                onChange={(e) => navigate({ sort: e.target.value, page: 1 })}
              >
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {filtered && (
          <div className="active-filters">
            <span>
              <Info size={14} />{' '}
              {query.q
                ? 'Search covers all categories. Choosing a category clears search.'
                : 'Category is active. Searching will clear this filter.'}
            </span>
            <button
              className="text-button"
              onClick={() => navigate({ q: '', category: '', page: 1 })}
            >
              Clear filters <X size={13} />
            </button>
          </div>
        )}
        {categoryError && (
          <div className="inline-notice">
            Categories could not load.{' '}
            <button className="text-button" onClick={retry}>
              Retry categories
            </button>
          </div>
        )}
        {busy ? (
          <TableSkeleton />
        ) : load.error ? (
          <ErrorState message={load.error} retry={retry} />
        ) : data?.products.length ? (
          <ProductTable
            products={data.products}
            sort={query.sort}
            onSort={(sort) => navigate({ sort, page: 1 })}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ) : (
          <EmptyState clear={() => navigate({ q: '', category: '', page: 1 })} />
        )}
        {data && (
          <Pagination
            page={query.page}
            size={query.size}
            total={data.total}
            onPage={(page) => navigate({ page })}
            onSize={(size) => navigate({ size, page: 1 })}
          />
        )}
      </section>
      <div className="catalog-footnote">
        <span>
          <span className="status-dot" />{' '}
          {hasChanges ? 'Includes your saved workspace changes' : 'Connected to DummyJSON'}
        </span>
        <span>Small details. Better days.</span>
      </div>
      {editing && (
        <ProductForm
          product={editing === true ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            if (editing === true) router.push(`/products/${p.id}`);
          }}
        />
      )}
      {deleting && <DeleteDialog product={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
