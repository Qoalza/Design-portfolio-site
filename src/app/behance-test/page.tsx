import type { Metadata } from "next";
import { BehanceTestWidget } from "../../components/behance-test-widget";

export const metadata: Metadata = {
  title: { absolute: "Interactive preview — Artur Designer" },
  robots: { index: false, follow: false },
};

export default function BehanceTestPage() {
  return <BehanceTestWidget />;
}
