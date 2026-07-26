export interface TechVersionOption {
  readonly value: string;
  readonly label: string;
}

export interface TechOption {
  readonly value: string;
  readonly label: string;
  readonly versions: readonly TechVersionOption[];
  readonly defaultVersion: string;
}

// Single Source of Truth definitions (as const)
export const SERVICE_TECH_OPTIONS = [
  {
    value: "express",
    label: "Express.js",
    versions: [{ value: "4.x", label: "4.x" }],
    defaultVersion: "4.x",
  },
] as const;

export const WEB_CLIENT_TECH_OPTIONS = [
  {
    value: "nextjs",
    label: "Next.js",
    versions: [{ value: "16.x", label: "16.x" }],
    defaultVersion: "16.x",
  },
] as const;

export const DATABASE_ENGINE_OPTIONS = [
  {
    value: "sqlite",
    label: "SQLite",
    versions: [{ value: "3.x", label: "3.x" }],
    defaultVersion: "3.x",
  },
] as const;

export const DATABASE_ORM_OPTIONS = [
  {
    value: "drizzle",
    label: "Drizzle ORM",
    versions: [{ value: "0.30.x", label: "0.30.x" }],
    defaultVersion: "0.30.x",
  },
] as const;

// Derived TypeScript Types (inferred directly from the single source of truth!)
export type ServiceTechStack = (typeof SERVICE_TECH_OPTIONS)[number]["value"];
export type ServiceTechVersion = (typeof SERVICE_TECH_OPTIONS)[number]["versions"][number]["value"];

export type WebClientTechStack = (typeof WEB_CLIENT_TECH_OPTIONS)[number]["value"];
export type WebClientTechVersion = (typeof WEB_CLIENT_TECH_OPTIONS)[number]["versions"][number]["value"];

export type DatabaseEngine = (typeof DATABASE_ENGINE_OPTIONS)[number]["value"];
export type DatabaseEngineVersion = (typeof DATABASE_ENGINE_OPTIONS)[number]["versions"][number]["value"];

export type DatabaseORM = (typeof DATABASE_ORM_OPTIONS)[number]["value"];
export type DatabaseOrmVersion = (typeof DATABASE_ORM_OPTIONS)[number]["versions"][number]["value"];

// Tuples for Zod z.enum validation (derived directly without re-typing)
export const ALL_TECH_STACK_VALUES = [
  ...SERVICE_TECH_OPTIONS.map((t) => t.value),
  ...WEB_CLIENT_TECH_OPTIONS.map((t) => t.value),
] as [string, ...string[]];

export const ALL_TECH_VERSION_VALUES = [
  ...SERVICE_TECH_OPTIONS.flatMap((t) => t.versions.map((v) => v.value)),
  ...WEB_CLIENT_TECH_OPTIONS.flatMap((t) => t.versions.map((v) => v.value)),
] as [string, ...string[]];

export const ALL_DATABASE_ENGINE_VALUES = [
  ...DATABASE_ENGINE_OPTIONS.map((e) => e.value),
] as [string, ...string[]];

export const ALL_DATABASE_ENGINE_VERSION_VALUES = [
  ...DATABASE_ENGINE_OPTIONS.flatMap((e) => e.versions.map((v) => v.value)),
] as [string, ...string[]];

export const ALL_DATABASE_ORM_VALUES = [
  ...DATABASE_ORM_OPTIONS.map((o) => o.value),
] as [string, ...string[]];

export const ALL_DATABASE_ORM_VERSION_VALUES = [
  ...DATABASE_ORM_OPTIONS.flatMap((o) => o.versions.map((v) => v.value)),
] as [string, ...string[]];
