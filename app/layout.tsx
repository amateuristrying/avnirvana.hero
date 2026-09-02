import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AV Nirvana India — Distributing Innovation & Excellence in Audio-Visual Experiences",
  description:
    "Premium audio, visual & distributed AV solutions imported and delivered with expert design support.",
};

export const viewport: Viewport = {
  themeColor: "#f2f4f7",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
