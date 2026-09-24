import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
export default function NotFound() {
  return (
    <div className="state standalone-state">
      <span className="state-icon">
        <PackageSearch size={32} />
      </span>
      <span className="eyebrow">404 · NOT FOUND</span>
      <h1>This page is off the shelf.</h1>
      <p>The page you’re looking for doesn’t exist.</p>
      <Link className="button primary" href="/products">
        Back to products
      </Link>
    </div>
  );
}
