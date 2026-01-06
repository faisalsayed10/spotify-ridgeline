import type { Metadata } from "next";
import { TikTok_Sans } from "next/font/google";
import "./globals.css";

const tiktokSans = TikTok_Sans({
  variable: "--font-tiktok-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Spotify Ridgeline",
  description: "Visualize your Spotify listening trends over time as a ridgeline chart",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${tiktokSans.variable} ${tiktokSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
