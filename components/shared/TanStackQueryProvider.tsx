'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

type TanStackQueryProviderProps = {
  children: React.ReactNode;
};

const TanStackQueryProvider = ({ children }: TanStackQueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
            staleTime: 5 * 1000,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default TanStackQueryProvider;
