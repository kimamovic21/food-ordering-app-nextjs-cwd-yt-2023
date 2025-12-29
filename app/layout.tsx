import type { Metadata } from 'next';
import { Roboto, Roboto_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
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
        className={`${roboto.variable} ${robotoMono.variable} antialiased min-h-screen flex flex-col w-full
        `}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <AppContext>
            <CartProvider>
              <Header />
              <main className='flex-1 max-w-5xl mx-auto p-4 mt-16'>
                <Toaster position='top-center' />
                {children}
              </main>
              <Footer />
            </CartProvider>
          </AppContext>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
