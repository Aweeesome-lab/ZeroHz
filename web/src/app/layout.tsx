import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { CSPostHogProvider } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZeroHz - Minimalist White Noise for Deep Focus",
  description:
    "A minimalist white noise player for macOS and Windows. Stay focused with ambient sounds.",
  openGraph: {
    title: "ZeroHz - Minimalist White Noise for Deep Focus",
    description:
      "A minimalist white noise player for macOS and Windows. Stay focused with ambient sounds.",
    url: "https://zerohz.app",
    siteName: "ZeroHz",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZeroHz - Minimalist White Noise",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeroHz - Minimalist White Noise for Deep Focus",
    description:
      "A minimalist white noise player for macOS and Windows. Stay focused with ambient sounds.",
    images: ["/og-image.jpg"],
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
        <CSPostHogProvider>
          {children}
          <Analytics />
        </CSPostHogProvider>
      </body>
    </html>
  );
}
