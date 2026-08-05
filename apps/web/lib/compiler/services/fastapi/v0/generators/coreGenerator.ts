import { CompiledFile } from "@workspace/canvas/types";

interface CoreGeneratorOptions {
  serviceName: string;
  port: string;
  corsOrigins: string;
}

export function generateCoreFiles({
  serviceName,
  port,
  corsOrigins,
}: CoreGeneratorOptions): CompiledFile[] {
  const files: CompiledFile[] = [];

  files.push({
    filename: "core/__init__.py",
    language: "python",
    content: `from .config import settings\nfrom .logger import get_logger\nfrom .response import format_response\n\n__all__ = ["settings", "get_logger", "format_response"]\n`,
  });

  files.push({
    filename: "core/config.py",
    language: "python",
    content: `import os

class Settings:
    SERVICE_NAME: str = "${serviceName}"
    PORT: int = int(os.getenv("PORT", "${port}"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    CORS_ORIGINS: str = "${corsOrigins}"

settings = Settings()
`,
  });

  files.push({
    filename: "core/logger.py",
    language: "python",
    content: `import logging
import sys

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "%(asctime)s - [%(name)s] - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
`,
  });

  files.push({
    filename: "core/response.py",
    language: "python",
    content: `from typing import Any, Dict
from datetime import datetime, timezone

def format_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
`,
  });

  return files;
}
