import type { Metadata } from "next";
import OpenArcPreview from "@/components/brand/OpenArcPreview";

export const metadata: Metadata = {
  title: "Open Arc preview",
  description:
    "Phase 1 preview of the LookFinesse Open Arc logo. The live logo is unchanged.",
  robots: { index: false, follow: false },
};

export default function BrandPreviewPage() {
  return <OpenArcPreview />;
}
