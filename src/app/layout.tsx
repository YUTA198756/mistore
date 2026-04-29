import type { Metadata, Viewport } from "next";
import "./globals.css";
import LiffInit from "@/components/LiffInit";
import Background from "@/components/Background";

export const metadata: Metadata = {
  title: "ミス・トレ",
  description: "まちがいをお宝に変えよう！",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ミス・トレ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#08081e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Background />
        <LiffInit />
        {children}
      </body>
    </html>
  );
}
