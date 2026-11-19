import Script from 'next/script';

/**
 * Google Tag Manager (the container loads Google Analytics and any other tags you set up in tagmanager.google.com).
 * The container ID comes from NEXT_PUBLIC_GTM_ID (.env locally, Environment Variables in Vercel); without it nothing loads.
 * Production only, so local development never counts as a visit.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function GoogleAnalytics() {
  if (!GTM_ID || process.env.NODE_ENV !== 'production') return null;
  return (
    <Script id="gtm" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';
      document.head.appendChild(s);
    `}</Script>
  );
}
