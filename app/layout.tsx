import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/sanity/queries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HallWay Creative",
  description: "Photography and videography by Andrew Hall.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // ponytail: a Sanity outage degrades to a footer with no contact links,
  // not a dead site — every page renders inside this layout.
  const settings = await getSiteSettings().catch((error) => {
    console.error("Failed to fetch site settings", error);
    return null;
  });

  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
