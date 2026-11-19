import Script from 'next/script';

/**
 * Google Analytics 4, loaded directly (no Tag Manager). The Measurement ID (G-XXXXXXXXXX) comes from NEXT_PUBLIC_GA_ID
 * (.env locally, Environment Variables in Vercel); without it nothing loads. Production only, so local development never counts as a visit.
 * The site is one page, so the automatic page_view is all it needs.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  if (!GA_ID || process.env.NODE_ENV !== 'production') return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
    </>
  );
}
