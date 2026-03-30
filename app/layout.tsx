import type { Metadata } from 'next';
import { Roboto, Roboto_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import LayoutWrapper from '../components/shared/LayoutWrapper';
import AppContext from '@/contexts/AppContext';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Food Ordering App',
  description: 'Food Ordering App with Next.js',
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
          <div className='min-h-screen flex flex-col w-full'>
            <AppContext>
              <CartProvider>
                <LayoutWrapper>
                  {children}
                  <Toaster position='top-center' />
                </LayoutWrapper>
              </CartProvider>
            </AppContext>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
