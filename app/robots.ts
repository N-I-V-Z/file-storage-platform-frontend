import type { MetadataRoute } from "next";
import { readEnvironment } from "@/src/lib/env";

export default function robots(): MetadataRoute.Robots {
  const appUrl = readEnvironment(process.env).appUrl;

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", appUrl).toString(),
  };
}
