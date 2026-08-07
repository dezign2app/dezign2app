import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import {
  Endpoint,
  AnyMessagingResource,
  UIEventItem,
  CompiledFile,
  CompiledWebClientResult,
} from "@workspace/canvas/types";
import { generateWebClientE2ETests } from "../../../generators/testGenerator";

import { LinkedEndpointInfo, PageInfo } from "./types";
import { getServicePort, resolveLinkedEndpoint } from "./endpointResolver";
import { labelToSlug, slugToComponentName } from "./slugUtils";
import { generateProjectConfigFiles } from "./configTemplates";
import {
  generateRootLayout,
  generatePageCode,
  generateRootIndexPage,
} from "./componentTemplates";
import { generateMiddleware } from "./middlewareTemplate";
import { generateAuthClient } from "../../../generators/auth-providers/better-auth/v1.7/generateAuthClient";

export type { LinkedEndpointInfo };
export { getServicePort, resolveLinkedEndpoint };

/**
 * Compiles WebClient nodes into Next.js App Router (v16.x) project structure
 */
export function compileNextjsV16WebClient(
  webClientNodes: BackendNode[],
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  projectName: string = "Blueprint Monorepo",
  testCases: SimulationTestCase[] = [],
): CompiledWebClientResult {
  const files: CompiledFile[] = [];

  const pagesInfo: PageInfo[] = [];
  const usedSlugs = new Set<string>();

  webClientNodes.forEach((node, idx) => {
    const rawLabel = node.data.label || `Page ${idx + 1}`;
    let slug = labelToSlug(rawLabel, idx);

    if (usedSlugs.has(slug)) {
      slug = `${slug}-${idx + 1}`;
    }
    usedSlugs.add(slug);

    const isRoot =
      idx === 0 && (slug === "home" || webClientNodes.length === 1);
    const routePath = isRoot ? "/" : `/${slug}`;
    const componentName = slugToComponentName(slug);

    pagesInfo.push({
      nodeId: node.id,
      label: rawLabel,
      description: node.data.description,
      slug,
      routePath,
      componentName,
      isRoot,
      accessType: node.data.accessType || "public",
      allowedRoles: node.data.allowedRoles,
      requiredPlans: node.data.requiredPlans,
      allowedOrgRoles: node.data.allowedOrgRoles,
      redirectTo: node.data.redirectTo,
      isAuthPage: node.data.isAuthPage,
      appSlug: node.data.appSlug,
      appName: node.data.appName,
    });
  });

  // Project configuration files
  files.push(...generateProjectConfigFiles());

  // Check if AuthNode is connected or auth rules are specified
  const authNode = allNodes.find((n) => n.type === "auth");
  const authPort = authNode?.data?.port || "3000";
  const authBaseUrl = authNode?.data?.baseUrl || `http://localhost:${authPort}`;

  // Generate Auth Client if protected routes or AuthNode exist
  const hasProtectedRoutes = pagesInfo.some((p) => p.accessType && p.accessType !== "public");
  if (authNode || hasProtectedRoutes) {
    files.push({
      filename: "lib/auth-client.ts",
      language: "typescript",
      content: generateAuthClient({
        baseUrl: authBaseUrl,
        plugins: ["adminClient", "organizationClient"],
      }),
    });
  }

  // Generate Route Protection Middleware
  files.push({
    filename: "middleware.ts",
    language: "typescript",
    content: generateMiddleware(pagesInfo),
  });

  // Root layout
  const pagesNavLinks = pagesInfo
    .map(
      (p) =>
        `<Link href="${p.routePath}" className="hover:text-indigo-400 transition-colors font-medium">${p.label}</Link>`,
    )
    .join("\n              ");

  files.push({
    filename: "app/layout.tsx",
    language: "typescript",
    content: generateRootLayout(projectName, pagesNavLinks),
  });

  const hasExplicitRoot = pagesInfo.some((p) => p.routePath === "/");

  webClientNodes.forEach((node, idx) => {
    const pageMeta = pagesInfo[idx]!;
    const rawEvents: UIEventItem[] = (node.data.events as UIEventItem[]) || [];

    const pageLoadEvents = rawEvents.filter((evt) => {
      const eStr = (evt.event || evt.name || "").toLowerCase();
      return eStr === "pageload" || eStr === "onload";
    });

    const actionEvents = rawEvents.filter(
      (evt) => !pageLoadEvents.includes(evt),
    );

    let pageLoadFetchStatements = "";
    if (pageLoadEvents.length === 0) {
      pageLoadFetchStatements = `setPageLoadData({ status: "idle", message: "No pageLoad event triggers attached to this page node." });`;
    } else {
      const statements: string[] = [];
      pageLoadEvents.forEach((evt, eIdx) => {
        const link = resolveLinkedEndpoint(
          node.id,
          evt.id,
          allNodes,
          allEdges,
          endpoints,
        );
        const eventNameStr = evt.name || "pageLoad";
        if (link) {
          statements.push(`
        try {
          const res_${eIdx} = await fetch("${link.fullUrl}", {
            method: "${link.method}",
            headers: { "Content-Type": "application/json" },
          });
          const json_${eIdx} = await res_${eIdx}.json();
          results["${eventNameStr}"] = json_${eIdx};
        } catch (err: any) {
          results["${eventNameStr}"] = { error: err.message, endpoint: "${link.fullUrl}" };
        }`);
        } else {
          statements.push(`
        results["${eventNameStr}"] = {
          status: "simulated",
          message: "pageLoad event triggered on mount (no target endpoint connected in canvas)",
        };`);
        }
      });

      pageLoadFetchStatements = `setPageLoadLoading(true);
      setPageLoadError(null);
      try {
        const results: Record<string, any> = {};
        ${statements.join("\n")}
        setPageLoadData(${pageLoadEvents.length === 1} ? results["${pageLoadEvents[0]?.name || "pageLoad"}"] : results);
      } catch (err: any) {
        setPageLoadError(err.message || "Failed to load page data");
      } finally {
        setPageLoadLoading(false);
      }`;
    }

    let actionButtonsJsx = "";
    if (actionEvents.length === 0) {
      actionButtonsJsx = `<p className="text-slate-500 text-sm italic">No click or trigger events configured for this page node.</p>`;
    } else {
      const buttonElems = actionEvents.map((evt) => {
        const link = resolveLinkedEndpoint(
          node.id,
          evt.id,
          allNodes,
          allEdges,
          endpoints,
        );
        const url = link ? link.fullUrl : "";
        const method = link ? link.method : "POST";
        const evtName = evt.name || "Action";
        const evtType = evt.event || "click";
        return `
              <Button
                onClick={() => handleTriggerAction("${evtName}", "${evtType}", "${url}", "${method}")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-indigo-500/30"
              >
                <span>${evtName}</span>
                <span className="text-xs opacity-75 font-mono">(${evtType})</span>
              </Button>`;
      });
      actionButtonsJsx = `<div className="flex flex-wrap gap-3">\n${buttonElems.join("\n")}\n          </div>`;
    }

    const pageCode = generatePageCode(
      pageMeta,
      pageLoadFetchStatements,
      actionButtonsJsx,
    );

    const targetFilePath = pageMeta.isRoot
      ? "app/page.tsx"
      : `app/${pageMeta.slug}/page.tsx`;

    files.push({
      filename: targetFilePath,
      language: "typescript",
      content: pageCode,
    });
  });

  if (!hasExplicitRoot) {
    const indexCards = pagesInfo
      .map(
        (p) => `
          <Link href="${p.routePath}" className="block bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 transition-all hover:shadow-lg group">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">${p.label}</h2>
              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono">${p.routePath}</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">${p.description || "Interactive Next.js page"}</p>
            <div className="flex items-center text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
              Open Page &rarr;
            </div>
          </Link>`,
      )
      .join("\n");

    files.push({
      filename: "app/page.tsx",
      language: "typescript",
      content: generateRootIndexPage(projectName, indexCards),
    });
  }

  files.push(
    ...generateWebClientE2ETests(
      webClientNodes,
      endpoints,
      events,
      allNodes,
      allEdges,
      testCases,
    ),
  );

  const webClientName =
    webClientNodes.length === 1
      ? webClientNodes[0]?.data.label || "web-client"
      : "web-client";
  const webClientId =
    webClientNodes.length === 1 ? webClientNodes[0]!.id : "web-client";

  return {
    webClientId,
    webClientName,
    files,
  };
}
