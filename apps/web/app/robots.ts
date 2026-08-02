import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dezign2app.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/docs",
          "/blog",
          "/about",
          "/early-believer",
          "/privacy",
          "/terms",
          "/terms-and-conditions",
          "/acceptable-use",
          "/aup",
          "/tutorials",
          "/support",
          "/careers",
          "/contact",
          "/partners",
          "/changelog",
          "/integrations",
        ],
        disallow: [
          "/api/",
          "/project/",
          "/projects",
          "/document/",
          "/dashboard/",
          "/workflows/",
          "/sign-in/",
          "/sign-up/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
