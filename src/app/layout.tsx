import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "運行管理教育 LMS",
  description: "プロドライバーのための安全教育 e-Learning システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
