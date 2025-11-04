import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "The Hockey Directory - Connect with Trusted Hockey Advisors",
    template: "%s | The Hockey Directory",
  },
  description:
    "Find and connect with verified hockey advisors, trainers, and development professionals across North America. Helping hockey families navigate elite hockey pathways.",
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "The Hockey Directory",
    title: "The Hockey Directory - Connect with Trusted Hockey Advisors",
    description:
      "Find and connect with verified hockey advisors, trainers, and development professionals across North America.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hockey Directory",
    description:
      "Find and connect with verified hockey advisors across North America.",
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
    <html lang="en" className={inter.variable}>
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
