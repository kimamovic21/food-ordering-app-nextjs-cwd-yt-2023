'use client';

import { Button } from '@/components/ui/button';

const SentryExampleClient = () => {
  return (
    <Button
      type='button'
      onClick={() => {
        throw new Error('Sentry example client error');
      }}
    >
      Trigger client error
    </Button>
  );
};

export default SentryExampleClient;
