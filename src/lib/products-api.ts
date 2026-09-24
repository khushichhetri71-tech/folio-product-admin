import { api } from './axios';
import type { Category, Product, ProductPage, Query } from './types';
import type { ProductInput } from './validation';
export async function getProducts(query: Query, signal?: AbortSignal): Promise<ProductPage> {
  const path = query.q
    ? '/products/search'
    : query.category
      ? `/products/category/${encodeURIComponent(query.category)}`
      : '/products';
  const [sortBy, order] = query.sort.split('-');
  const { data } = await api.get<ProductPage>(path, {
    signal,
    params: {
      limit: query.size,
      skip: (query.page - 1) * query.size,
      q: query.q || undefined,
      sortBy: query.sort === 'default' ? undefined : sortBy,
      order,
      delay: query.delay || undefined,
    },
  });
  return data;
}
// A complete base is needed only after a simulated write, so local sorting/filtering/counts remain correct.
export async function getAllProducts(signal?: AbortSignal) {
  const products: Product[] = [];
  let total = Infinity;
  for (let skip = 0; skip < total; skip += 100) {
    const { data } = await api.get<ProductPage>('/products', {
      signal,
      params: { limit: 100, skip },
    });
    products.push(...data.products);
    total = data.total;
    if (!data.products.length) break;
  }
  return products;
}
export const getCategories = async (signal?: AbortSignal) =>
  (await api.get<Category[]>('/products/categories', { signal })).data;
export const getProduct = async (id: number, signal?: AbortSignal) =>
  (await api.get<Product>(`/products/${id}`, { signal })).data;
export const addProduct = async (input: ProductInput) =>
  (await api.post<Product>('/products/add', input)).data;
export const updateProduct = async (id: number, input: ProductInput) =>
  (await api.put<Product>(`/products/${id}`, input)).data;
export const deleteProduct = async (id: number) => {
  await api.delete(`/products/${id}`);
};
