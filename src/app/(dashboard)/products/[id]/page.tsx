import { ProductDetail } from '@/components/product-detail';
export const metadata = { title: 'Product details' };
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetail id={/^\d+$/.test(id) ? Number(id) : NaN} />;
}
