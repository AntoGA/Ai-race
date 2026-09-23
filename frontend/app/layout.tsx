import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Виртуальные гонки ИИ",
  description: "Платформа трансляций виртуальных гонок ИИ-пилотов",
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
