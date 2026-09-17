import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/supabase/queries";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HallWay Creative",
  description: "Photography and videography by Andrew Hall.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // ponytail: a Supabase outage degrades to a footer with no contact links,
  // not a dead site — every page renders inside this layout.
  const settings = await getSiteSettings().catch((error) => {
    console.error("Failed to fetch site settings", error);
    return null;
  });

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${inter.variable} flex min-h-screen flex-col bg-bg text-ink`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.add('light')}}catch(e){}`}
        </Script>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
