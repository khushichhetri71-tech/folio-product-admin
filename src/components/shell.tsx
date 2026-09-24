'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Package,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  Menu,
  X,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { Brand } from './brand';
import { useWorkspace } from './workspace-provider';
import { logout } from '@/lib/auth-api';
import { errorMessage } from '@/lib/axios';
export function Shell({ children }: { children: React.ReactNode }) {
  const { user, notify } = useWorkspace();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  async function signOut() {
    if (leaving) return;
    setLeaving(true);
    try {
      await logout();
      router.replace('/login');
      router.refresh();
    } catch (e) {
      notify(errorMessage(e));
      setLeaving(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-logo">
          <Link href="/products" aria-label="Folio home">
            <Brand />
          </Link>
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
          <PanelLeftClose className="sidebar-collapse" size={17} />
        </div>
        <div className="workspace-switch">
          <span className="workspace-avatar">F</span>
          <div>
            <strong>Folio workspace</strong>
            <span>Product management</span>
          </div>
          <span className="workspace-plan">DEMO</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          <Link className="nav-item active" href="/products" onClick={() => setOpen(false)}>
            <Package size={19} />
            <span>Products</span>
            <ChevronRight size={15} />
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <div className="note-symbol">
              <ShieldCheck size={19} />
            </div>
            <strong>Your space to make changes</strong>
            <p>Explore the catalog. Updates stay in your browser workspace.</p>
            <a href="https://dummyjson.com/docs/products" target="_blank" rel="noreferrer">
              About the demo <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="user-block">
            <span className="avatar">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
            <div>
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span>Workspace admin</span>
            </div>
            <button
              className="icon-button"
              title="Sign out"
              aria-label="Sign out"
              disabled={leaving}
              onClick={signOut}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <Link href="/products">Products</Link>
            {path !== '/products' && (
              <>
                <ChevronRight size={14} />
                <span className="breadcrumb-current">Details</span>
              </>
            )}
          </div>
          <div className="topbar-right">
            <span className="environment">
              <i />
              Demo workspace
            </span>
            <span className="avatar small">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="app-footer">
          <span>Made for a more organized everyday.</span>
          <span>Folio · Product workspace</span>
        </footer>
      </div>
    </div>
  );
}
