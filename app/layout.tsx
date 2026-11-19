import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/ReduxProvider';

export const metadata: Metadata = {
  title: 'THIHA AUNG — Software Engineer',
  description: 'Software Engineer — building intelligent systems with style',
  openGraph: {
    title: 'THIHA AUNG — Software Engineer',
    description: 'Software Engineer — building intelligent systems with style',
    url: 'https://thihaeung.com',
    siteName: 'Thiha Aung Portfolio',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THIHA AUNG — Software Engineer',
    description: 'Software Engineer — building intelligent systems with style',
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
      </body>
    </html>
  );
}
