export function labelToSlug(label: string, index: number): string {
  const clean = label.trim().toLowerCase();
  if (clean === "home" || clean === "index" || clean === "/") {
    return "home";
  }
  const slug = clean.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `page-${index + 1}`;
}

export function slugToComponentName(slug: string): string {
  if (slug === "home") return "HomePage";
  const camel = slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
  return camel.charAt(0).toUpperCase() + camel.slice(1) + "Page";
}
