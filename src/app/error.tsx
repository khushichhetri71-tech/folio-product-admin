'use client';
import { ErrorState } from '@/components/states';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-state">
      <ErrorState
        message="The service may be temporarily unavailable. Please try again."
        retry={reset}
      />
    </main>
  );
}
