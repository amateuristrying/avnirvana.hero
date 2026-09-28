import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

/* The Spotlight faces: Onest for the body and pills; General Sans for the
 * display type, loaded from Fontshare below as in the reference. */
const onest = Onest({
  subsets: ["latin"],
  display: "swap",
  variable: "--nf-onest",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AV Nirvana India — Distributing Innovation & Excellence in Audio-Visual Experiences",
  description:
    "Premium audio, visual & distributed AV solutions imported and delivered with expert design support.",
};

export const viewport: Viewport = {
  themeColor: "#080d96",
  colorScheme: "dark",
};

/* Hide the animated components before first paint (see `html.lk-js` in
 * spotlight.css). If the app never takes over, show the page anyway. */
const ENTRY_STATE = `(function(){var d=document.documentElement;d.classList.add("lk-js");setTimeout(function(){if(!window.__lkLive)d.classList.remove("lk-js")},4000)})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The pre-paint script adds `lk-js` before hydration; that one attribute is
    // expected to differ from the server render.
    <html lang="en" className={onest.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ENTRY_STATE }} />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
