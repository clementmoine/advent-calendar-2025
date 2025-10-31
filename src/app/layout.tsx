import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';
import { ArdoiseProvider } from '@/contexts/ardoise-context';
import { PiggyBankProvider } from '@/contexts/piggy-bank-context';
import CommonLayout from '@/components/common-layout';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Advent Calendar 2025',
  description: 'Discover a new game every day until Christmas!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='fr' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <ArdoiseProvider>
              <PiggyBankProvider>
                <CommonLayout>{children}</CommonLayout>
              </PiggyBankProvider>
            </ArdoiseProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
