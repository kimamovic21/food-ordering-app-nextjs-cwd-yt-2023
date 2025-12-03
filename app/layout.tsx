import type { Metadata } from 'next';
import { Roboto, Roboto_Mono } from 'next/font/google';
import './globals.css';
import Header from './(home)/Header';
import Footer from './(home)/Footer';
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
    <html lang='en'>
      <body
        className={
          `${roboto.variable} ${robotoMono.variable} antialiased min-h-screen flex flex-col
        `}
      >
        <AppContext>
          <Header />
          <main className='flex-1 max-w-4xl mx-auto p-4'>
            {children}
          </main>
          <Footer />
        </AppContext>
      </body>
    </html>
  );
};

export default RootLayout;