/**
 * Converts Express/URL path params (:id) to FastAPI/Python format ({id})
 */
export function convertPathParams(path: string): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}

/**
 * Generates a clean Pythonic snake_case route file name without double underscores (__)
 */
export function toPythonRouteFileName(
  method: string,
  pathOrName: string,
  index: number,
): string {
  const methodStr = (method || "get").toLowerCase();
  const cleanPath = (pathOrName || "")
    .replace(/^https?:\/\/[^\/]+/, "")
    .replace(/^[\/]+|[\/]+$/g, "")
    .replace(/:([a-zA-Z0-9_]+)|\{([a-zA-Z0-9_]+)\}/g, "by_$1$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase();

  const base = cleanPath ? `${methodStr}_${cleanPath}` : `${methodStr}_root`;
  const sanitized = base.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return sanitized || `${methodStr}_route_${index + 1}`;
}
