import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

type VerifyEmailPageProps = {
  searchParams?: { email?: string };
};

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const defaultEmail = searchParams?.email || '';

  return (
    <Suspense fallback={null}>
      <VerifyEmailClient defaultEmail={defaultEmail} />
    </Suspense>
  );
}
