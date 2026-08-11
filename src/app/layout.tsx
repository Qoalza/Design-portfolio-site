import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Артур Арустамян — Product Designer",
  description:
    "Портфолио продуктового дизайнера: B2B, B2E, SaaS и сложные внутренние системы.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
