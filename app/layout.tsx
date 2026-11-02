import type { Metadata, Viewport } from "next";
import { Anton, Figtree } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--anton", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--body", display: "swap" });

export const metadata: Metadata = {
  title: "Clocked",
  description: "Clock in your day. Skip it, and your friends' coaches have you clocked.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Clocked", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-180.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0f1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
