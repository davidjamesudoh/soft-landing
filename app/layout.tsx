import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/providers";

const EDLavonia = localFont({
  src: [
    {
      path: "../public/fonts/EDLavonia-Regular.ttf",
      weight: "400",
    },
  ],
  variable: "--font-ed-lavonia",
  display: "swap",
});

const NewKansas = localFont({
  src: [
    {
      path: "../public/fonts/NewKansasSwashRegularItalic.otf",
      weight: "400",
    },
  ],
  variable: "--font-new-kansas",
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Extend content edge-to-edge, behind the iOS status bar and floating
  // address bar, so sections scroll through them (translucent, no solid band).
  viewportFit: "cover" as const,
};

export const metadata: Metadata = {
  title: "Tomini and David",
  description: "Tomini and David",
  keywords: "Tomini and David",

  authors: [{ name: "Tomini and David" }],
  creator: "Tomini and David",
  publisher: "Tomini and David",
  icons: {
    icon: "icon.svg",
    shortcut: "icon.svg",
    apple: "icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://softlanding.fyi",
    title: "Tomini and David",
    description: "RSVP for Tomini and David's wedding",
    siteName: "Tomini and David",
    images: ["/images/og-image.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomini and David",
    description: "Tomini and David",
    images: ["/images/og-image.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${EDLavonia.variable} ${dmSans.variable} ${NewKansas.variable} antialiased font-dm-sans flex flex-col`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
