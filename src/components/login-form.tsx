'use client';
import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Layers2,
  LockKeyhole,
  LoaderCircle,
  Package,
  Check,
  Sparkles,
} from 'lucide-react';
import { Brand } from './brand';
import { login } from '@/lib/auth-api';
import { errorMessage } from '@/lib/axios';
import { safeReturnPath } from '@/lib/validation';
import { useHydrated } from '@/lib/use-hydrated';
export function LoginForm() {
  const router = useRouter(),
    params = useSearchParams();
  const [visible, setVisible] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  const hydrated = useHydrated();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await login(String(form.get('username')).trim(), String(form.get('password')));
      router.replace(safeReturnPath(params.get('next')));
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div className="story-content">
          <span className="story-pill">
            <span /> A little order. A lot of possibility.
          </span>
          <h1>
            Good products.
            <br />
            Great <span>perspective.</span>
          </h1>
          <p>
            Everything in your catalog, thoughtfully brought together. A clearer view of what’s
            next.
          </p>
          <div className="catalog-art" aria-hidden="true">
            <div className="art-circle" />
            <div className="art-panel">
              <div className="art-panel-head">
                <span>
                  <Layers2 size={18} /> Your catalog
                </span>
                <span className="art-dots">•••</span>
              </div>
              <div className="art-row">
                <div className="art-object bottle">
                  <span />
                </div>
                <div>
                  <b>Everyday essentials</b>
                  <span>Carefully curated</span>
                </div>
                <span className="art-check">
                  <Check size={14} />
                </span>
              </div>
              <div className="art-row">
                <div className="art-object cube">
                  <Package size={26} />
                </div>
                <div>
                  <b>A place for everything</b>
                  <span>Always organized</span>
                </div>
                <span className="art-check">
                  <Check size={14} />
                </span>
              </div>
              <div className="art-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <span className="art-caption">A fresh perspective on your inventory</span>
            </div>
            <div className="art-floating">
              <span>
                <Sparkles size={20} />
              </span>
              <div>
                <b>Less busywork.</b>
                <small>More room to grow.</small>
              </div>
            </div>
          </div>
        </div>
        <div className="story-footer">
          <span>YOUR CATALOG, IN GOOD COMPANY.</span>
          <span>© {new Date().getFullYear()} Folio</span>
        </div>
      </section>
      <section className="login-form-section">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <div className="login-form-wrap">
          <div className="login-icon">
            <LockKeyhole size={23} />
          </div>
          <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
          <h2>Back to the good stuff.</h2>
          <p className="login-subtitle">Sign in to keep your catalog moving.</p>
          {params.has('expired') && (
            <div className="inline-notice">
              Your session expired. Sign in to pick up where you left off.
            </div>
          )}
          <form onSubmit={submit} method="post">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              placeholder="Enter your username"
              autoComplete="username"
              required
              maxLength={100}
              disabled={pending || !hydrated}
            />
            <div className="label-row">
              <label htmlFor="password">Password</label>
            </div>
            <div className="password-input">
              <input
                id="password"
                name="password"
                type={visible ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                maxLength={200}
                disabled={pending || !hydrated}
              />
              <button
                type="button"
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="icon-button"
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary login-submit" disabled={pending || !hydrated}>
              {pending ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in to workspace
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="demo-credentials">
            <div>
              <span className="demo-dot" />
              <strong>Take a look around</strong>
              <span className="tag">Demo access</span>
            </div>
            <p>Use these credentials to explore the workspace.</p>
            <div className="credential-values">
              <span>
                Username <code>emilys</code>
              </span>
              <span>
                Password <code>emilyspass</code>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const username = document.getElementById('username') as HTMLInputElement;
                const password = document.getElementById('password') as HTMLInputElement;
                username.value = 'emilys';
                password.value = 'emilyspass';
                username.focus();
              }}
              disabled={pending || !hydrated}
            >
              Fill in demo credentials <ArrowRight size={14} />
            </button>
          </div>
          <p className="login-footnote">
            <LockKeyhole size={13} /> A secure sign-in for your product workspace.
          </p>
        </div>
        <span className="login-bottom">A thoughtful workspace for your products.</span>
      </section>
    </main>
  );
}
