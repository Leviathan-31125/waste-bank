import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bank Sampah BMS2",
  description: "Miniature production for your special action figure",
  icons: {
    icon: '/icon-bms2.png',
    shortcut: '/icon-bms2.png',
    apple: '/icon-bms2.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-base-content`}
      >
        {children}
      </body>
    </html>
  );
}
