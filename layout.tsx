import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DayOff – Create. Connect. Go Live.",
  description: "Short videos, stories, and live streaming. Take a DayOff.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
