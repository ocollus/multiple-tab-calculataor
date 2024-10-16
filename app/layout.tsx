import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Roboto } from 'next/font/google';
import { Noto_Sans_Math } from 'next/font/google';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'] });
const notoSansMath = Noto_Sans_Math({ subsets: ['math'], weight: ['400'] });

export const metadata: Metadata = {
  title: 'MultiTab Calculator',
  description: 'Multiple Calculator on Multiple Tab',
  openGraph: {
    title: 'MultiTab Calculator', // Same as title above
    description: 'Multiple Calculator on Multiple Tab', // Same as description above
    url: 'https://multiple-tab-calculator.vercel.app/', // Your website URL
    siteName: 'MultiTab Calculator', // Your website name
    images: [
      {
        url: '/Frame 11.png', // Thumbnail image URL
        width: 800, // Image width
        height: 450, // Image height
        alt: 'Thumbnail description', // Image description
      },
    ],
    locale: 'en_US', // Locale setting
    type: 'website', // Type of content
  },
  twitter: {
    card: 'summary_large_image', // Twitter card type
    title: 'MultiTab Calculator',
    description: 'Multiple Calculator on Multiple Tab',
    images: ['/Frame 11.jpg'], // Twitter image URL
  },
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