'use client';
import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, PackagePlus, Save } from 'lucide-react';
import { Dialog } from './dialog';
import { useWorkspace } from './workspace-provider';
import { getCategories } from '@/lib/products-api';
import { errorMessage } from '@/lib/axios';
import { productSchema } from '@/lib/validation';
import type { Category, Product } from '@/lib/types';
export function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product?: Product;
  onClose: () => void;
  onSaved?: (product: Product) => void;
}) {
  const { save } = useWorkspace();
  const [categories, setCategories] = useState<Category[]>([]),
    [error, setError] = useState(''),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [pending, setPending] = useState(false),
    [retry, setRetry] = useState(0),
    [categoryError, setCategoryError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    const c = new AbortController();
    getCategories(c.signal)
      .then(setCategories)
      .catch((e) => {
        if (!c.signal.aborted) setCategoryError(errorMessage(e));
      });
    return () => c.abort();
  }, [retry]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    const form = new FormData(e.currentTarget);
    const result = productSchema.safeParse({
      title: form.get('title'),
      description: form.get('description'),
      category: form.get('category'),
      price: form.get('price') === '' ? NaN : Number(form.get('price')),
      stock: form.get('stock') === '' ? NaN : Number(form.get('stock')),
      rating: product?.rating ?? 0,
    });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setError('');
    lock.current = true;
    setPending(true);
    try {
      const saved = await save(result.data, product);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      lock.current = false;
      setPending(false);
    }
  }
  const fieldError = (field: string) =>
    errors[field] ? (
      <span id={`${field}-error`} className="field-error">
        {errors[field]}
      </span>
    ) : null;
  return (
    <Dialog
      title={product ? 'Edit product' : 'Add a new product'}
      subtitle={
        product
          ? 'A few thoughtful updates to your catalog.'
          : 'Give your next great product a place to live.'
      }
      onClose={onClose}
      busy={pending}
    >
      <form className="product-form" onSubmit={submit} noValidate>
        <div className="form-intro">
          <span>
            <PackagePlus size={24} />
          </span>
          <div>
            <strong>Product information</strong>
            <p>The details that help your products stand out.</p>
          </div>
        </div>
        <label htmlFor="title">
          Product name <span>*</span>
        </label>
        <input
          id="title"
          name="title"
          autoFocus
          defaultValue={product?.title}
          placeholder="e.g. Everyday ceramic mug"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          maxLength={120}
        />
        {fieldError('title')}
        <label htmlFor="description">
          Description <span>*</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description}
          placeholder="What makes this product special?"
          rows={3}
          maxLength={2000}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {fieldError('description')}
        <label htmlFor="category">
          Category <span>*</span>
        </label>
        <select
          id="category"
          name="category"
          defaultValue={product?.category || ''}
          aria-invalid={!!errors.category}
        >
          <option value="">Choose a category</option>
          {product && !categories.some((c) => c.slug === product.category) && (
            <option value={product.category}>{product.category}</option>
          )}
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldError('category')}
        {categoryError && (
          <div className="field-error">
            {categoryError}{' '}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setCategoryError('');
                setRetry((n) => n + 1);
              }}
            >
              Retry categories
            </button>
          </div>
        )}
        <div className="form-grid">
          <div>
            <label htmlFor="price">
              Price (USD) <span>*</span>
            </label>
            <div className="price-input">
              <span>$</span>
              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={product?.price}
                placeholder="0.00"
                aria-invalid={!!errors.price}
              />
            </div>
            {fieldError('price')}
          </div>
          <div>
            <label htmlFor="stock">
              Stock quantity <span>*</span>
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.stock ?? 0}
              aria-invalid={!!errors.stock}
            />
            {fieldError('stock')}
          </div>
        </div>
        <p className="form-help">Changes are saved to this browser’s demo workspace.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" disabled={pending} onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={pending || !categories.length}>
            {pending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{' '}
            {pending ? 'Saving…' : product ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
