import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/ReduxProvider';

export const metadata: Metadata = {
  title: 'THIHA AUNG — AI Engineer',
  description: 'AI Engineer & Vibe Coder — building intelligent systems with style',
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
