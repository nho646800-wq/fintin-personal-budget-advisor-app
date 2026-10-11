import type { Metadata } from "next";
import { Suspense } from "react";
import { Fredoka, Geist, Geist_Mono } from "next/font/google";
import PageTransition from "@/components/PageTransition";
import RouteLoadingIndicator from "@/components/RouteLoadingIndicator";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinTin",
  description: "Personal budget advisor",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
    // attributes onto <html>/<body> before React hydrates, which would
    // otherwise throw a noisy hydration mismatch in development.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fredoka.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col"
      >
        <Suspense fallback={null}>
          <RouteLoadingIndicator />
        </Suspense>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
