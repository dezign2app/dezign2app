import type { InferPageType } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import { docs } from "fumadocs-mdx:collections/server";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

type DocsPage = InferPageType<typeof source>;

export async function getLLMText(page: DocsPage) {
  const sections = [
    `# ${page.data.title ?? page.slugs.at(-1) ?? "Untitled"}`,
    `URL: ${page.url}`,
    page.data.description,
    await page.data.getText("raw"),
  ];

  return sections.filter(Boolean).join("\n\n");
}
