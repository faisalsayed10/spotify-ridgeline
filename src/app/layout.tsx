import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Spotify Ridgeline",
  description: "Visualize your Spotify listening trends over time as a ridgeline chart",
  metadataBase: new URL("https://spotridge.com"),
  openGraph: {
    title: "Spotify Ridgeline",
    description: "Visualize your Spotify listening trends over time",
    url: "https://spotridge.com",
    siteName: "Spotify Ridgeline",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spotify Ridgeline",
    description: "Visualize your Spotify listening trends over time",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${poppins.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
