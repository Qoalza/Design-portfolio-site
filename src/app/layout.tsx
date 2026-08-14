import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NavigationScrollController } from "../components/navigation-scroll-controller";
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
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <link
          rel="preload"
          href="/fonts/onest-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <NavigationScrollController />
        {children}
      </body>
    </html>
  );
}
