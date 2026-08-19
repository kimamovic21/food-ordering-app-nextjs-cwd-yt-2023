/**
 * @vitest-environment jsdom
 */

import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TanStackQueryProvider from '@/components/shared/TanStackQueryProvider';

const QueryConsumer = () => {
  const { data = 'loading' } = useQuery({
    queryFn: async () => 'loaded',
    queryKey: ['tanstack-provider-test'],
  });

  return <p>{data}</p>;
};

describe('TanStackQueryProvider', () => {
  it('provides a query client to child components', async () => {
    render(
      <TanStackQueryProvider>
        <QueryConsumer />
      </TanStackQueryProvider>
    );

    expect(await screen.findByText('loaded')).toBeInTheDocument();
  });
});
