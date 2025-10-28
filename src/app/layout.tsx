import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dark Regenaissance",
  description: "Voice of the underground - a dark forest illuminated by mycelial networks",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#0a0a12',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.jpg', type: 'image/jpeg' }
    ],
    apple: '/favicon.jpg',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: "Dark Regenaissance",
    description: "Voice of the underground - a dark forest illuminated by mycelial networks",
    images: ['/favicon.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Dark Regenaissance",
    description: "Voice of the underground - a dark forest illuminated by mycelial networks",
    images: ['/favicon.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
