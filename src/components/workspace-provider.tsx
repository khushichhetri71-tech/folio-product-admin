'use client';
import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { Product, User, Workspace } from '@/lib/types';
import { emptyWorkspace } from '@/lib/query';
import { readWorkspace } from '@/lib/workspace-storage';
import { addProduct, deleteProduct, updateProduct } from '@/lib/products-api';
import type { ProductInput } from '@/lib/validation';
interface Context {
  user: User;
  changes: Workspace;
  ready: boolean;
  save: (input: ProductInput, original?: Product) => Promise<Product>;
  remove: (product: Product) => Promise<void>;
  notify: (message: string) => void;
}
const WorkspaceContext = createContext<Context | null>(null);
export function WorkspaceProvider({ user, children }: { user: User; children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (_: { changes: Workspace; ready: boolean }, value: { changes: Workspace; ready: boolean }) =>
      value,
    { changes: emptyWorkspace(), ready: false },
  );
  const changesRef = useRef(state.changes);
  const [notice, setNotice] = useReducer((_: string, next: string) => next, '');
  const key = `folio-workspace-v1-${user.id}`;
  useEffect(() => {
    let changes = emptyWorkspace();
    try {
      changes = readWorkspace(localStorage.getItem(key));
    } catch {
      setNotice('Saved workspace data could not be read. Showing the original catalog.');
    }
    changesRef.current = changes;
    dispatch({ changes, ready: true });
    const sync = (e: StorageEvent) => {
      if (e.key === key) window.location.reload();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  function commit(changes: Workspace) {
    try {
      localStorage.setItem(key, JSON.stringify(changes));
    } catch {
      throw new Error(
        'Your browser could not save this change. Free up storage or allow site storage and try again.',
      );
    }
    changesRef.current = changes;
    dispatch({ changes, ready: true });
  }
  async function save(input: ProductInput, original?: Product) {
    let product: Product;
    const current = changesRef.current;
    if (original) {
      if (!current.added.some((p) => p.id === original.id)) await updateProduct(original.id, input);
      product = { ...original, ...input };
      commit(
        current.added.some((p) => p.id === original.id)
          ? { ...current, added: current.added.map((p) => (p.id === original.id ? product : p)) }
          : { ...current, updated: { ...current.updated, [original.id]: product } },
      );
    } else {
      await addProduct(input);
      product = { ...input, id: Date.now(), thumbnail: '', images: [], reviews: [] };
      commit({ ...current, added: [product, ...current.added] });
    }
    setNotice(original ? 'Product updated successfully.' : 'Product added to your workspace.');
    return product;
  }
  async function remove(product: Product) {
    const current = changesRef.current;
    if (!current.added.some((p) => p.id === product.id)) await deleteProduct(product.id);
    commit({
      ...current,
      added: current.added.filter((p) => p.id !== product.id),
      deleted: [...new Set([...current.deleted, product.id])],
    });
    setNotice('Product deleted successfully.');
  }
  return (
    <WorkspaceContext.Provider
      value={{ user, changes: state.changes, ready: state.ready, save, remove, notify: setNotice }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('Workspace provider is missing.');
  return context;
}
