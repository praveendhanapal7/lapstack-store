import './globals.css';
import CartProvider from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lapstack.in'),
  title: 'Lapstack — Premium refurbished laptops',
  description: 'Tested, ready-to-use refurbished laptops from ₹21,000. Buy online, delivered to your door.',
  openGraph: { siteName: 'Lapstack', type: 'website', locale: 'en_IN' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
