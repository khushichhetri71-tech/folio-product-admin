'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageNumbers } from '@/lib/query';
export function Pagination({
  page,
  size,
  total,
  onPage,
  onSize,
}: {
  page: number;
  size: number;
  total: number;
  onPage: (p: number) => void;
  onSize: (s: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <div className="pagination-summary">
        Showing{' '}
        <strong>
          {total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)}
        </strong>{' '}
        of <strong>{total}</strong>
      </div>
      <div className="pagination-controls">
        <label className="page-size">
          Rows per page{' '}
          <select
            aria-label="Rows per page"
            value={size}
            onChange={(e) => onSize(Number(e.target.value))}
          >
            {[10, 20, 50].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <nav aria-label="Product pagination">
          <button
            className="page-button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          {pageNumbers(page, count).map((p, i) =>
            typeof p === 'number' ? (
              <button
                className={`page-button ${p === page ? 'selected' : ''}`}
                key={p}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            ) : (
              <span className="page-gap" key={`gap-${i}`}>
                …
              </span>
            ),
          )}
          <button
            className="page-button"
            aria-label="Next page"
            disabled={page >= count}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}
