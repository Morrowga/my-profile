import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/ReduxProvider';

export const metadata: Metadata = {
  title: 'THIHA AUNG — AI Engineer',
  description: 'AI Engineer & Vibe Coder — building intelligent systems with style',
  openGraph: {
    title: 'THIHA AUNG — AI Engineer',
    description: 'AI Engineer & Vibe Coder — building intelligent systems with style',
    url: 'https://thihaeung.com',
    siteName: 'Thiha Aung Portfolio',
    images: [
      {
        url: 'https://thihaeung.com/preview/preview.png',  
        width: 1200,
        height: 630,
        alt: 'Thiha Aung — AI Engineer',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THIHA AUNG — AI Engineer',
    description: 'AI Engineer & Vibe Coder — building intelligent systems with style',
    images: ['https://thihaeung.com/preview/preview.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
