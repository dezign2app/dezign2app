import { CompiledFile } from "../types";

/**
 * Generates the shared `@workspace/logger` package for the compiled monorepo.
 * Allows microservices and web client apps to use a unified logger controlled
 * via LOG_LEVEL or NEXT_PUBLIC_LOG_LEVEL environment variables.
 */
export function generateLoggerPackage(): CompiledFile[] {
  const packageJson = JSON.stringify(
    {
      name: "@workspace/logger",
      version: "0.0.0",
      private: true,
      description: "Shared logger utility with environment-configurable log levels (debug, info, warn, error, none)",
      main: "src/index.ts",
      types: "src/index.ts",
      scripts: {
        build: "tsc",
        "check-types": "tsc --noEmit",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        "@types/node": "^20.11.0",
        typescript: "^5.3.3",
      },
    },
    null,
    2
  );

  const tsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: {
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
    },
    null,
    2
  );

  const indexCode = `export type LogLevel = "debug" | "info" | "warn" | "error" | "none";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

function getActiveLogLevel(overrideLevel?: LogLevel): LogLevel {
  if (overrideLevel && LOG_LEVELS[overrideLevel] !== undefined) {
    return overrideLevel;
  }
  const envLevel =
    (typeof process !== "undefined" &&
      (process.env.LOG_LEVEL ||
       process.env.NEXT_PUBLIC_LOG_LEVEL ||
       process.env.REACT_APP_LOG_LEVEL)) ||
    "info";
  const normalized = String(envLevel).trim().toLowerCase().replace(/['"]/g, "") as LogLevel;
  return LOG_LEVELS[normalized] !== undefined ? normalized : "info";
}

export class Logger {
  private scope: string;
  private levelOverride?: LogLevel;

  constructor(scope: string = "App", level?: LogLevel) {
    this.scope = scope;
    this.levelOverride = level;
  }

  public setLevel(level: LogLevel): void {
    this.levelOverride = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const activeLevel = getActiveLogLevel(this.levelOverride);
    return LOG_LEVELS[level] >= LOG_LEVELS[activeLevel];
  }

  private formatHeader(level: LogLevel): string {
    const timestamp = new Date().toISOString();
    return \`[\${timestamp}] [\${level.toUpperCase()}] [\${this.scope}]\`;
  }

  debug(message: string, ...meta: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(\`\${this.formatHeader("debug")} \${message}\`, ...meta);
    }
  }

  info(message: string, ...meta: any[]): void {
    if (this.shouldLog("info")) {
      console.info(\`\${this.formatHeader("info")} \${message}\`, ...meta);
    }
  }

  warn(message: string, ...meta: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(\`\${this.formatHeader("warn")} \${message}\`, ...meta);
    }
  }

  error(message: string, ...meta: any[]): void {
    if (this.shouldLog("error")) {
      console.error(\`\${this.formatHeader("error")} \${message}\`, ...meta);
    }
  }
}

export function createLogger(scope: string, level?: LogLevel): Logger {
  return new Logger(scope, level);
}

export const logger = new Logger("Global");
`;

  return [
    {
      filename: "package.json",
      language: "json",
      content: packageJson,
    },
    {
      filename: "tsconfig.json",
      language: "json",
      content: tsconfig,
    },
    {
      filename: "src/index.ts",
      language: "typescript",
      content: indexCode,
    },
  ];
}
