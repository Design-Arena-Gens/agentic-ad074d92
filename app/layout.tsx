import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Agentic Browser Assistant',
  description:
    'A Supabase-backed browsing agent that ingests pages, extracts context, and guides you through actionable tasks.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}
