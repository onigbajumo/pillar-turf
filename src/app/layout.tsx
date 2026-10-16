import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Big_Shoulders } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-display" });
const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const num = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-num" });

export const metadata: Metadata = {
  title: { default: "Pillars Turf", template: "%s · Pillars Turf" },
  description: "League tables, fixtures, results and awards for tournaments at Pillars Turf.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${num.variable}`}>
      <body>{children}</body>
    </html>
  );
}
