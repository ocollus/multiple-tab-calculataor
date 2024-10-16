import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Roboto } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'MultiTab Calculator',
  description: 'MultiTab Calculator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <html lang="en">
      <body className={`${inter.className} transition-colors duration-100`}>{children}</body>
    </html>
  );
}