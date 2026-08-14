import type { MetadataRoute } from "next";
import { LANGS, brand } from "@/data/site";

export const dynamic = "force-static";

const PATHS = ["", "/work", "/about", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return LANGS.flatMap((lang) =>
    PATHS.map((path) => ({
      url: `${brand.url}/${lang}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
  );
}
