import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/shared/providers/query-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import { Toaster } from '@/shared/components/ui/sonner';

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
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('insight-hub-theme');
                  var isDark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
