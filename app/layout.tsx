import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/ReduxProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE_URL, SITE_NAME, TITLE, DESCRIPTION } from '@/lib/site';

// metadataBase turns the relative addresses below (and the generated preview picture) into full ones for link previews.
// It is set on purpose: left out, Next.js guesses it from the project's production domain in Vercel.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Science+Gothic:wght@100..900&family=Lato:ital,wght@0,400;0,700;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ReduxProvider>{children}</ReduxProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
