import type { Product, Query, Workspace } from './types';
export const sorts = [
  { value: 'default', label: 'Default order' },
  { value: 'title-asc', label: 'Name: A to Z' },
  { value: 'title-desc', label: 'Name: Z to A' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
];
export function parseQuery(params: URLSearchParams): Query {
  const page = Number(params.get('page') || 1),
    size = Number(params.get('size') || 10);
  const q = (params.get('q') || '').trim().slice(0, 200);
  const category = params.get('category') || '';
  return {
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1,
    size: [10, 20, 50].includes(size) ? size : 10,
    q,
    category: q ? '' : /^[a-z0-9-]{1,100}$/.test(category) ? category : '',
    sort: sorts.some((s) => s.value === params.get('sort')) ? params.get('sort')! : 'default',
    delay: Math.max(0, Math.min(5000, Number(params.get('delay')) || 0)),
  };
}
export function queryString(q: Query) {
  const p = new URLSearchParams();
  if (q.page !== 1) p.set('page', String(q.page));
  if (q.size !== 10) p.set('size', String(q.size));
  if (q.q) p.set('q', q.q);
  if (q.category) p.set('category', q.category);
  if (q.sort !== 'default') p.set('sort', q.sort);
  if (q.delay) p.set('delay', String(q.delay));
  return p.toString();
}
export const emptyWorkspace = (): Workspace => ({ added: [], updated: {}, deleted: [] });
export function mergeProducts(base: Product[], changes: Workspace) {
  const removed = new Set(changes.deleted);
  return [...changes.added, ...base.map((p) => changes.updated[p.id] || p)].filter(
    (p) => !removed.has(p.id),
  );
}
export function selectProducts(products: Product[], q: Query) {
  const filtered = products.filter(
    (p) =>
      (!q.category || p.category === q.category) &&
      (!q.q ||
        `${p.title} ${p.description} ${p.brand || ''}`.toLowerCase().includes(q.q.toLowerCase())),
  );
  if (q.sort !== 'default') {
    const [key, order] = q.sort.split('-');
    filtered.sort((a, b) => {
      const diff =
        key === 'title'
          ? a.title.localeCompare(b.title)
          : a[key as 'price' | 'rating'] - b[key as 'price' | 'rating'];
      return (order === 'desc' ? -diff : diff) || a.id - b.id;
    });
  }
  const total = filtered.length,
    page = Math.min(q.page, Math.max(1, Math.ceil(total / q.size)));
  return {
    products: filtered.slice((page - 1) * q.size, page * q.size),
    total,
    limit: q.size,
    skip: (page - 1) * q.size,
    page,
  };
}
export function pageNumbers(page: number, total: number): (number | string)[] {
  const list: (number | string)[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) list.push(i);
    else if (list[list.length - 1] !== '…') list.push('…');
  }
  return list;
}
export const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export const categoryName = (value: string) =>
  value
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
