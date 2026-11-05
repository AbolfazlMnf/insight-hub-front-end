import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/shared/providers/query-provider';

export const metadata: Metadata = {
  title: 'Insight Hub — Workspace Knowledge Assistant',
  description: 'Enterprise Agentic RAG and Knowledge Workspace Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
