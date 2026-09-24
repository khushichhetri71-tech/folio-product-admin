'use client';
import { useRef, useState } from 'react';
import { Trash2, LoaderCircle } from 'lucide-react';
import { Dialog } from './dialog';
import { useWorkspace } from './workspace-provider';
import type { Product } from '@/lib/types';
import { errorMessage } from '@/lib/axios';
export function DeleteDialog({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { remove } = useWorkspace();
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    try {
      await remove(product);
      onDeleted?.();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <Dialog title="Delete this product?" onClose={onClose} busy={pending}>
      <div className="delete-body">
        <span className="state-icon error-icon">
          <Trash2 size={27} />
        </span>
        <p>
          <strong>{product.title}</strong> will be removed from your workspace. This action cannot
          be undone.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="dialog-actions">
        <button className="button secondary" onClick={onClose} disabled={pending} autoFocus>
          Keep product
        </button>
        <button className="button danger" disabled={pending} onClick={confirm}>
          {pending ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}{' '}
          {pending ? 'Deleting…' : 'Delete product'}
        </button>
      </div>
    </Dialog>
  );
}
