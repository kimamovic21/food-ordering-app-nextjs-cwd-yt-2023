import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Roboto, Roboto_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/libs/metadata';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import LayoutWrapper from '../components/shared/LayoutWrapper';
import AppContext from '@/contexts/AppContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { SoundSettingsProvider } from '@/contexts/SoundSettingsContext';
import TanStackQueryProvider from '@/components/shared/TanStackQueryProvider';
import AppErrorBoundary from '@/components/shared/AppErrorBoundary';
import AppCommandPalette from '@/components/shared/AppCommandPalette';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: SITE_NAME,
    template: `${SITE_NAME} | %s`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: '/pizza-logo.svg',
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased min-h-screen flex flex-col w-full`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <div className='min-h-screen flex flex-col w-full'>
              <AppContext>
                <SoundSettingsProvider>
                  <TanStackQueryProvider>
                    <MessagesProvider>
                      <NotificationsProvider>
                        <CartProvider>
                          <AppErrorBoundary>
                            <LayoutWrapper>
                              {children}
                              <Toaster position='top-center' />
                              <AppCommandPalette />
                              <Analytics />
                            </LayoutWrapper>
                          </AppErrorBoundary>
                        </CartProvider>
                      </NotificationsProvider>
                    </MessagesProvider>
                  </TanStackQueryProvider>
                </SoundSettingsProvider>
              </AppContext>
            </div>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
