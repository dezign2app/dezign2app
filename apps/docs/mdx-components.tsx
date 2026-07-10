import type { MDXComponents } from "mdx/types";

import { getMDXComponents } from "@/lib/mdx";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components);
}
