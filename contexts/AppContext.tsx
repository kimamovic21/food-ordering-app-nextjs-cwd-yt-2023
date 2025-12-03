'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

type AppContextProps = {
  children: ReactNode;
};

const AppContext = ({ children }: AppContextProps) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};

export default AppContext;