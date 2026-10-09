import './globals.css';
import Script from 'next/script';
import { AuthProvider } from '@/components/Auth';
import CartProvider from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SiteStats from '@/components/SiteStats';

// Lapstack's own Meta Pixel ("Lapstack Pixel" in the Lapstack Meta business portfolio). NEXT_PUBLIC_META_PIXEL_ID can override it.
const PIXEL = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '3214943238710618').replace(/\D/g, '');

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lapstack.in'),
  title: 'Lapstack — Premium refurbished laptops',
  description: 'Tested, ready-to-use refurbished laptops from ₹21,000. Buy online, delivered to your door in 2 days.',
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
        {/* Meta Pixel */}
        {PIXEL ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">{`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL}');
              fbq('track', 'PageView');
            `}</Script>
            <noscript><img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL}&ev=PageView&noscript=1`} /></noscript>
          </>
        ) : null}
        <SiteStats />
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
