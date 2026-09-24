import { Suspense } from 'react';
import { Catalog } from '@/components/catalog';
import { Loading } from '@/components/states';
export const metadata = { title: 'Products' };
export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Catalog />
    </Suspense>
  );
}
