import type { Metadata } from "next";

export const SITE_DESCRIPTION =
  "Портфолио продуктового дизайнера: B2B, B2E, SaaS и сложные внутренние системы.";

const SOCIAL_PREVIEW = {
  url: "/artur-designer-social-preview.png",
  width: 1800,
  height: 945,
  alt: "Артур А. — Product Designer",
} as const;

export function createSocialMetadata(url: string): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: "Артур А.",
      title: "Артур А.",
      description: "PRODUCT DESIGNER",
      url,
      images: [SOCIAL_PREVIEW],
    },
    twitter: {
      card: "summary_large_image",
      title: "Артур А.",
      description: "PRODUCT DESIGNER",
      images: [SOCIAL_PREVIEW],
    },
  };
}
