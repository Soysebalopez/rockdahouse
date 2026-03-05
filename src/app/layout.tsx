import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RockDaHouse — DJ Console",
  description: "Mix music from YouTube in your browser. Every song on YouTube. Your browser is the DJ booth.",
};

// Inline script to apply saved theme before paint (prevents flash of wrong theme).
// Content is a hardcoded constant — no user input, no XSS risk.
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('rdh-theme')||'{}');if(t.state&&t.state.theme)document.documentElement.dataset.theme=t.state.theme}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
