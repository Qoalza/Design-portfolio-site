import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { absolute: "Ошибка — Artur Designer" },
};

export default function ErrorTestLayout({ children }: { children: ReactNode }) {
  return children;
}
