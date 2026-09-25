'use client';
import { useEffect, useReducer, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Star,
  Package,
  Truck,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  PackageSearch,
} from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { getProduct } from '@/lib/products-api';
import { ApiError, errorMessage } from '@/lib/axios';
import { categoryName, money } from '@/lib/query';
import type { Product } from '@/lib/types';
import { Loading, ErrorState } from './states';
import { ProductImage } from './product-image';
import { Stock } from './product-table';
import { ProductForm } from './product-form';
import { DeleteDialog } from './delete-dialog';
type State = { product: Product | null; error: string; notFound: boolean; loading: boolean };
export function ProductDetail({ id }: { id: number }) {
  const { changes, ready } = useWorkspace();
  const router = useRouter();
  const [state, dispatch] = useReducer((_: State, next: State) => next, {
    product: null,
    error: '',
    notFound: false,
    loading: true,
  });
  const [retry, reload] = useReducer((n) => n + 1, 0);
  const [editing, setEditing] = useState(false),
    [deleting, setDeleting] = useState(false),
    [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const local = changes.added.find((p) => p.id === id) || changes.updated[id];
    if (!Number.isSafeInteger(id) || id < 1 || changes.deleted.includes(id)) {
      dispatch({ product: null, error: '', notFound: true, loading: false });
      return;
    }
    if (local) {
      dispatch({ product: local, error: '', notFound: false, loading: false });
      return;
    }
    dispatch({ product: null, error: '', notFound: false, loading: true });
    getProduct(id, controller.signal)
      .then((product) => {
        if (!controller.signal.aborted)
          dispatch({ product, error: '', notFound: false, loading: false });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          dispatch({
            product: null,
            error: errorMessage(e),
            notFound: e instanceof ApiError && e.status === 404,
            loading: false,
          });
      });
    return () => controller.abort();
  }, [id, changes, ready, retry]);
  if (state.loading) return <Loading label="Finding your product…" />;
  if (state.notFound)
    return (
      <div className="state">
        <span className="state-icon">
          <PackageSearch size={32} />
        </span>
        <span className="eyebrow">PRODUCT NOT FOUND</span>
        <h1>This product is off the shelf.</h1>
        <p>It may have been removed, or the link may be incorrect.</p>
        <Link href="/products" className="button primary">
          <ArrowLeft size={16} />
          Back to products
        </Link>
      </div>
    );
  if (state.error) return <ErrorState message={state.error} retry={reload} />;
  const p = state.product!;
  const images = p.images?.length ? p.images : p.thumbnail ? [p.thumbnail] : [];
  return (
    <div className="detail-page">
      <Link className="back-link" href="/products">
        <ArrowLeft size={16} />
        Back to products
      </Link>
      <div className="page-heading detail-heading">
        <div>
          <span className="eyebrow">A CLOSER LOOK</span>
          <h1>
            Product details<span className="heading-dot">.</span>
          </h1>
          <p>The little things that make this product yours.</p>
        </div>
        <div className="heading-actions">
          <button className="button secondary delete-text" onClick={() => setDeleting(true)}>
            <Trash2 size={16} />
            Delete
          </button>
          <button className="button primary" onClick={() => setEditing(true)}>
            <Pencil size={16} />
            Edit product
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <section className="gallery">
          <div className="gallery-stage">
            <span className="gallery-label">THE PRODUCT EDIT</span>
            <ProductImage src={selected || images[0]} title={p.title} large />
            <span className="gallery-counter">
              {images.length
                ? `${Math.max(0, images.indexOf(selected || images[0])) + 1} / ${images.length}`
                : 'No image available'}
            </span>
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((src, i) => (
                <button
                  key={src}
                  className={src === (selected || images[0]) ? 'selected' : ''}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={src === (selected || images[0])}
                  onClick={() => setSelected(src)}
                >
                  <ProductImage src={src} title={`${p.title}, image ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="product-info">
          <span className="category-tag">{categoryName(p.category)}</span>
          <h2>{p.title}</h2>
          <div className="detail-rating">
            <span className="rating">
              <Star size={16} fill="currentColor" />
              {p.rating.toFixed(1)}
            </span>
            <span>·</span>
            <a href="#reviews">{p.reviews?.length || 0} reviews</a>
            <span>·</span>
            <span>{p.brand || 'Independent brand'}</span>
          </div>
          <div className="detail-price">
            {money(p.price)}
            <span>INR</span>
          </div>
          <Stock value={p.stock} />
          <div className="description">
            <h3>About this product</h3>
            <p>{p.description}</p>
          </div>
          <dl className="product-meta">
            <div>
              <dt>Product ID</dt>
              <dd>#{p.id}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{p.sku || `PRD-${p.id}`}</dd>
            </div>
            <div>
              <dt>Available inventory</dt>
              <dd>{p.stock} units</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{categoryName(p.category)}</dd>
            </div>
          </dl>
          <div className="service-list">
            <div>
              <Truck size={18} />
              <span>{p.shippingInformation || 'Shipping information not provided'}</span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>{p.warrantyInformation || 'Warranty information not provided'}</span>
            </div>
            <div>
              <RotateCcw size={18} />
              <span>{p.returnPolicy || 'Return policy not provided'}</span>
            </div>
          </div>
        </section>
      </div>
      <section className="reviews-panel" id="reviews">
        <div className="panel-heading">
          <div className="panel-title">
            <h2>Customer reviews</h2>
            <span className="count-tag">{p.reviews?.length || 0}</span>
          </div>
          <MessageSquare size={19} />
        </div>
        {p.reviews?.length ? (
          <div className="reviews-grid">
            {p.reviews.map((r, i) => (
              <article className="review" key={i}>
                <div className="review-stars" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star key={j} size={14} fill={j < r.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p>“{r.comment}”</p>
                <div className="review-person">
                  <span className="avatar small">
                    {r.reviewerName
                      .split(' ')
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div>
                    <strong>{r.reviewerName}</strong>
                    <span>
                      {new Date(r.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </span>
                  </div>
                  <span className="verified">Verified buyer</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="state">
            <Package size={26} />
            <h3>A fresh start</h3>
            <p>This product hasn’t received any reviews yet.</p>
          </div>
        )}
      </section>
      {editing && <ProductForm product={p} onClose={() => setEditing(false)} />}{' '}
      {deleting && (
        <DeleteDialog
          product={p}
          onClose={() => setDeleting(false)}
          onDeleted={() => router.push('/products')}
        />
      )}
    </div>
  );
}
