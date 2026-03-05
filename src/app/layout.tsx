import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RockDaHouse — DJ Console",
  description: "Mix music from YouTube in your browser. Every song on YouTube. Your browser is the DJ booth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
