'use client';
import { AlertCircle, LoaderCircle, PackageSearch, RotateCw } from 'lucide-react';
export function Loading({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <LoaderCircle className="spin" size={28} />
      <p>{label}</p>
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="state" role="alert">
      <span className="state-icon error-icon">
        <AlertCircle size={26} />
      </span>
      <h3>We couldn’t load this</h3>
      <p>{message}</p>
      <button className="button secondary" onClick={retry}>
        <RotateCw size={15} />
        Try again
      </button>
    </div>
  );
}
export function EmptyState({ clear }: { clear: () => void }) {
  return (
    <div className="state">
      <span className="state-icon">
        <PackageSearch size={30} />
      </span>
      <h3>No products found</h3>
      <p>Try a different search or reset your filters.</p>
      <button className="button secondary" onClick={clear}>
        Clear filters
      </button>
    </div>
  );
}
export function TableSkeleton() {
  return (
    <div className="table-skeleton" role="status" aria-label="Loading products">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <span className="skeleton square" />
          <span className="skeleton wide" />
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      ))}
    </div>
  );
}
