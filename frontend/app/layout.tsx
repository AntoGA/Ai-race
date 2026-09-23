import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Виртуальные гонки ИИ",
  description: "Платформа трансляций виртуальных гонок ИИ-пилотов",
  manifest: "/manifest.json",
  applicationName: "AI Racing Platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Race",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1117",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-bg text-slate-100 antialiased">{children}</body>
    </html>
  );
}
