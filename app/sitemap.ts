import type { MetadataRoute } from "next";
import { readEnvironment } from "@/src/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = readEnvironment(process.env).appUrl;

  return [{ url: new URL("/", appUrl).toString() }];
}
