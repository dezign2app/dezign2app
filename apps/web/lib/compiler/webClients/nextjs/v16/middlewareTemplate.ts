import { PageInfo } from "./types";

/**
 * Generates Next.js App Router middleware.ts for route protection
 */
export function generateMiddleware(pagesInfo: PageInfo[]): string {
  const protectedPages = pagesInfo.filter(
    (p) => p.accessType && p.accessType !== "public",
  );

  if (protectedPages.length === 0) {
    return `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
`;
  }

  const routeRules = protectedPages.map((p) => {
    const route = p.routePath;
    const accessType = p.accessType;
    const redirect = p.redirectTo || (accessType === "payment-gated" ? "/pricing" : accessType === "org-gated" ? "/select-org" : "/login");
    const roles = JSON.stringify(p.allowedRoles || []);
    const plans = JSON.stringify(p.requiredPlans || []);
    const orgRoles = JSON.stringify(p.allowedOrgRoles || []);

    return `  {
    path: "${route}",
    accessType: "${accessType}",
    redirectTo: "${redirect}",
    allowedRoles: ${roles},
    requiredPlans: ${plans},
    allowedOrgRoles: ${orgRoles},
  }`;
  });

  return `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface RouteRule {
  path: string;
  accessType: "private" | "role-gated" | "payment-gated" | "org-gated";
  redirectTo: string;
  allowedRoles: string[];
  requiredPlans: string[];
  allowedOrgRoles: string[];
}

const PROTECTED_ROUTES: RouteRule[] = [
${routeRules.join(",\n")}
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const matchedRule = PROTECTED_ROUTES.find((r) => 
    r.path === "/" ? pathname === "/" : pathname.startsWith(r.path)
  );

  if (!matchedRule) {
    return NextResponse.next();
  }

  // Check auth session cookie / bearer token
  const token = request.cookies.get("better-auth.session_token")?.value || 
                request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const loginUrl = new URL(matchedRule.redirectTo, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Additional role, payment plan, or org membership checks can be evaluated here or via session API
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
`;
}
