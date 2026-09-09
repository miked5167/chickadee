import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "The Hockey Directory - Research Hockey Advisors",
    template: "%s | The Hockey Directory",
  },
  description:
    "Research hockey advisors and agencies across Canada and the United States. Compare listing details, build a shortlist, and contact advisors directly.",
  keywords: [
    "hockey advisor",
    "hockey consultant",
    "college hockey recruiting",
    "prep school hockey",
    "junior hockey",
    "hockey development",
    "hockey training",
  ],
  authors: [{ name: "The Hockey Directory" }],
  creator: "The Hockey Directory",
  publisher: "The Hockey Directory",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://thehockeydirectory.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "The Hockey Directory",
    title: "The Hockey Directory - Research Hockey Advisors",
    description:
      "Research hockey advisors and agencies across Canada and the United States.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hockey Directory",
    description:
      "Research hockey advisors and agencies across Canada and the United States.",
    images: [
      {
        url: "/hockey-directory-hero-v1.png",
        width: 2048,
        height: 819,
        alt: "A hockey family reviewing player pathways with an advisor at the rink",
      },
    ],
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
    <html lang="en" className={`${manrope.variable} ${barlowCondensed.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <GoogleAnalytics />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
