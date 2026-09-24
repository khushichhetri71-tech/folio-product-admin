'use client';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { useState } from 'react';
export function ProductImage({
  src,
  title,
  large = false,
}: {
  src?: string;
  title: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`product-image ${large ? 'large' : ''}`}>
      {src && !failed ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes={large ? '(max-width: 768px) 90vw, 40vw' : '56px'}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <Package size={large ? 68 : 23} strokeWidth={1.25} />
      )}
    </div>
  );
}
