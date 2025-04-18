import { MobileNav } from '@/components/common/mobile-nav';
import Nav from '@/components/common/nav';
import { Footer } from '@/components/footer';
import { ApolloClientProvider } from '@/components/providers/apollo-provider';
import { PrivyAuthProvider } from '@/components/providers/privy-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TokenProvider } from '@/hooks/useTokenContext';
import { SUPABASE_BUCKET } from '@trump-fun/common';
import { Analytics } from '@vercel/analytics/react';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Trump.fun - Predict The Donald's Next Move",
  description: 'Bet on what Trump will say or do next on the Trump.fun prediction market platform',
  icons: {
    icon: `${SUPABASE_BUCKET}/logo/trump.fun.logo.ico`,
    apple: `${SUPABASE_BUCKET}/logo/trump.fun.logo.jpg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <PrivyAuthProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <ApolloClientProvider>
              <TokenProvider>
                <div className='mx-auto max-w-screen-xl'>
                  <Nav />
                  <div className='pt-16 md:pt-20'>{children}</div>
                  <Toaster
                    position='bottom-right'
                    duration={5000}
                    closeButton
                    theme='light'
                    className='z-50'
                  />
                  <MobileNav />
                  <Footer />
                </div>
              </TokenProvider>
            </ApolloClientProvider>
          </ThemeProvider>
        </PrivyAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
