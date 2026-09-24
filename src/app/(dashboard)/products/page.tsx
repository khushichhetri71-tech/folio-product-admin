import { requireSession } from '@/lib/server-auth';
import { Suspense } from 'react';
import { Catalog } from '@/components/catalog';
import { Loading } from '@/components/states';
export const metadata = { title: 'Products' };
export default async function ProductsPage() {
  await requireSession();
  return (
    <Suspense fallback={<Loading />}>
      <Catalog />
    </Suspense>
  );
}
