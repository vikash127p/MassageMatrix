import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { DiscordContextProvider } from '@/contexts/DiscordContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MessageMatrix',
  description: 'Powered by Stream Chat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="en">
        <body className={inter.className}>
          <DiscordContextProvider>{children}</DiscordContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
