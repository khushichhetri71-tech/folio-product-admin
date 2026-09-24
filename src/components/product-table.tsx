'use client';
import Link from 'next/link';
import { ArrowUpRight, Pencil, Star, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { ProductImage } from './product-image';
import type { Product } from '@/lib/types';
import { categoryName, money } from '@/lib/query';
export function Stock({ value }: { value: number }) {
  return (
    <span className={`stock-badge ${value === 0 ? 'out' : value < 10 ? 'low' : 'in'}`}>
      <i />
      {value === 0 ? 'Out of stock' : value < 10 ? 'Low stock' : 'In stock'}
      <span className="stock-count">{value}</span>
    </span>
  );
}
function Actions({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="row-actions">
      <button
        className="icon-button"
        aria-label={`Edit ${product.title}`}
        title="Edit product"
        onClick={() => onEdit(product)}
      >
        <Pencil size={15} />
      </button>
      <button
        className="icon-button delete-action"
        aria-label={`Delete ${product.title}`}
        title="Delete product"
        onClick={() => onDelete(product)}
      >
        <Trash2 size={15} />
      </button>
      <Link
        className="icon-button"
        href={`/products/${product.id}`}
        aria-label={`View ${product.title}`}
        title="View details"
      >
        <ArrowUpRight size={17} />
      </Link>
    </div>
  );
}
export function ProductTable({
  products,
  sort,
  onSort,
  onEdit,
  onDelete,
}: {
  products: Product[];
  sort: string;
  onSort: (value: string) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const heading = (key: string, label: string) => (
    <button onClick={() => onSort(`${key}-${sort === `${key}-asc` ? 'desc' : 'asc'}`)}>
      {label}
      {sort.startsWith(key) ? (
        sort.endsWith('desc') ? (
          <ArrowDown size={12} />
        ) : (
          <ArrowUp size={12} />
        )
      ) : (
        <ArrowDown size={12} className="muted" />
      )}
    </button>
  );
  return (
    <>
      <div className="desktop-products">
        <table>
          <thead>
            <tr>
              <th
                aria-sort={
                  sort.startsWith('title')
                    ? sort.endsWith('asc')
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                {heading('title', 'Product')}
              </th>
              <th>Category</th>
              <th
                aria-sort={
                  sort.startsWith('price')
                    ? sort.endsWith('asc')
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                {heading('price', 'Price')}
              </th>
              <th
                aria-sort={
                  sort.startsWith('rating')
                    ? sort.endsWith('asc')
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                {heading('rating', 'Rating')}
              </th>
              <th>Stock status</th>
              <th className="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="product-cell" href={`/products/${p.id}`}>
                    <ProductImage src={p.thumbnail} title={p.title} />
                    <div>
                      <strong>{p.title}</strong>
                      <span>{p.sku || `PRD-${String(p.id).padStart(4, '0')}`}</span>
                    </div>
                  </Link>
                </td>
                <td>
                  <span className="category-tag">{categoryName(p.category)}</span>
                </td>
                <td className="price-cell">{money(p.price)}</td>
                <td>
                  <span className="rating">
                    <Star size={14} fill="currentColor" />
                    {p.rating.toFixed(1)}
                  </span>
                </td>
                <td>
                  <Stock value={p.stock} />
                </td>
                <td>
                  <Actions product={p} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-products">
        {products.map((p) => (
          <article className="product-card" key={p.id}>
            <Link className="product-cell" href={`/products/${p.id}`}>
              <ProductImage src={p.thumbnail} title={p.title} />
              <div>
                <span className="mobile-category">{categoryName(p.category)}</span>
                <strong>{p.title}</strong>
                <span className="rating">
                  <Star size={13} fill="currentColor" />
                  {p.rating.toFixed(1)}
                </span>
              </div>
            </Link>
            <div className="card-values">
              <strong>{money(p.price)}</strong>
              <Stock value={p.stock} />
            </div>
            <div className="card-actions">
              <Link href={`/products/${p.id}`}>
                View product <ArrowUpRight size={14} />
              </Link>
              <Actions product={p} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
