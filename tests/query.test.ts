import { describe, expect, it } from 'vitest';
import {
  emptyWorkspace,
  mergeProducts,
  pageNumbers,
  parseQuery,
  queryString,
  selectProducts,
} from '../src/lib/query';
import { productSchema, safeReturnPath } from '../src/lib/validation';
import type { Product } from '../src/lib/types';
const product = (id: number, title: string, price: number, category = 'beauty'): Product => ({
  id,
  title,
  price,
  category,
  description: 'A thoughtfully made product',
  stock: 20,
  rating: 4,
  thumbnail: '',
  images: [],
  reviews: [],
});
const query = (s = '') => parseQuery(new URLSearchParams(s));
describe('URL state', () => {
  it.each(['abc', '-1', '0', '1.5', 'Infinity', 'NaN'])('repairs invalid page %s', (page) =>
    expect(query(`page=${page}`).page).toBe(1),
  );
  it('bounds extreme pages safely', () => expect(query('page=9999999').page).toBe(100000));
  it('validates size and sort', () => {
    expect(query('size=999&sort=unsafe')).toMatchObject({ size: 10, sort: 'default' });
  });
  it('gives search precedence over category', () =>
    expect(query('q=phone&category=beauty').category).toBe(''));
  it('rejects category path injection', () => expect(query('category=../auth').category).toBe(''));
  it('round trips valid URL state', () => {
    const q = query('page=3&size=20&q=phone&sort=price-desc&delay=2000');
    expect(query(queryString(q))).toEqual(q);
  });
  it('clamps delay', () => {
    expect(query('delay=9000').delay).toBe(5000);
    expect(query('delay=-1').delay).toBe(0);
  });
});
describe('workspace reconciliation', () => {
  const base = [
    product(1, 'Lipstick', 12),
    product(2, 'Apple', 2, 'groceries'),
    product(3, 'Blush', 8),
  ];
  it('merges additions, edits, deletions without mutating base', () => {
    const c = emptyWorkspace();
    c.added = [product(99, 'New', 7)];
    c.updated[1] = product(1, 'Updated', 6);
    c.deleted = [2];
    const merged = mergeProducts(base, c);
    expect(merged.map((p) => p.title)).toEqual(['New', 'Updated', 'Blush']);
    expect(base[0].title).toBe('Lipstick');
  });
  it('filters before pagination and fixes out-of-range pages', () => {
    const result = selectProducts(base, query('category=beauty&page=999'));
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.products).toHaveLength(2);
  });
  it('sorts numeric values numerically', () =>
    expect(selectProducts(base, query('sort=price-asc')).products.map((p) => p.price)).toEqual([
      2, 8, 12,
    ]));
  it('sorts title descending', () =>
    expect(selectProducts(base, query('sort=title-desc')).products[0].title).toBe('Lipstick'));
  it('searches case-insensitively', () =>
    expect(selectProducts(base, query('q=LIP')).products[0].id).toBe(1));
  it('has a stable empty page', () =>
    expect(selectProducts([], query('page=999'))).toMatchObject({
      total: 0,
      page: 1,
      skip: 0,
      products: [],
    }));
  it('keeps first, last and nearby page numbers', () =>
    expect(pageNumbers(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10]));
});
describe('validation', () => {
  const valid = {
    title: 'Ceramic cup',
    description: 'A handmade ceramic cup',
    category: 'home-decoration',
    price: 20,
    stock: 5,
    rating: 0,
  };
  it('accepts a complete product', () => expect(productSchema.safeParse(valid).success).toBe(true));
  it.each([
    { title: ' ' },
    { description: 'tiny' },
    { category: '' },
    { price: 0 },
    { price: NaN },
    { stock: -1 },
    { stock: 1.5 },
    { rating: 6 },
  ])('rejects invalid values %o', (patch) =>
    expect(productSchema.safeParse({ ...valid, ...patch }).success).toBe(false),
  );
  it.each([
    'https://evil.com',
    '//evil.com',
    '/api/auth/logout',
    '/products\\evil',
    '/products/../api',
  ])('blocks unsafe return path %s', (path) => expect(safeReturnPath(path)).toBe('/products'));
  it('preserves a valid product return path', () =>
    expect(safeReturnPath('/products/1?q=test')).toBe('/products/1?q=test'));
});
