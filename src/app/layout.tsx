import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { NavigationTrailProvider } from "../components/contextual-navigation";
import { NavigationScrollController } from "../components/navigation-scroll-controller";
import { SmoothScrollProvider } from "../components/smooth-scroll-provider";
import { getBuildShaAttribute } from "../lib/build-provenance";
import { PROJECT_ACTION_BAR_BOOTSTRAP } from "../lib/project-action-bar-bootstrap";
import { createSocialMetadata, SITE_DESCRIPTION } from "../lib/site-metadata";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://art-des.ru"),
  title: { absolute: "Страница не найдена — Artur Designer" },
  description: SITE_DESCRIPTION,
  ...createSocialMetadata("/"),
  icons: {
    icon: [
      {
        url: "/artur-designer-favicon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const buildSha = getBuildShaAttribute(process.env.NEXT_PUBLIC_BUILD_SHA);

  return (
    <html lang="ru" data-scroll-behavior="smooth" data-build-sha={buildSha}>
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
        <Script id="project-action-bar-bootstrap" strategy="beforeInteractive">
          {PROJECT_ACTION_BAR_BOOTSTRAP}
        </Script>
        <SmoothScrollProvider>
          <NavigationTrailProvider>
            <NavigationScrollController />
            {children}
          </NavigationTrailProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
