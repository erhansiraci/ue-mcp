import { configSchema, Config } from "./schema.js";
import { defaults } from "./defaults.js";

export { Config } from "./schema.js";
export { defaults } from "./defaults.js";

/**
 * Parse an integer from environment variable with fallback
 */
function parseIntEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Parse a boolean from environment variable
 */
function parseBoolEnv(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

/**
 * Load configuration from environment variables with defaults
 *
 * Priority: Environment variables > CLI args (set before calling) > defaults
 */
export function loadConfig(): Config {
  const rawConfig = {
    host: process.env.UE_HOST ?? defaults.host,
    httpPort: parseIntEnv(process.env.UE_HTTP_PORT, defaults.httpPort),
    wsPort: parseIntEnv(process.env.UE_WS_PORT, defaults.wsPort),
    timeout: parseIntEnv(process.env.UE_TIMEOUT, defaults.timeout),
    mockMode: parseBoolEnv(process.env.UE_MOCK_MODE),
    retryAttempts: parseIntEnv(process.env.UE_RETRY_ATTEMPTS, defaults.retryAttempts),
    retryDelay: parseIntEnv(process.env.UE_RETRY_DELAY, defaults.retryDelay),
    verbose: parseBoolEnv(process.env.UE_VERBOSE),
  };

  // Validate configuration
  const validated = configSchema.parse(rawConfig);

  // Derive URLs from host and ports
  return {
    ...validated,
    httpUrl: `http://${validated.host}:${validated.httpPort}`,
    wsUrl: `ws://${validated.host}:${validated.wsPort}`,
  };
}

/**
 * Log configuration (for debugging)
 */
export function logConfig(config: Config): void {
  console.error("Unreal Engine MCP Server Configuration:");
  console.error(`  HTTP URL: ${config.httpUrl}`);
  console.error(`  WebSocket URL: ${config.wsUrl}`);
  console.error(`  Timeout: ${config.timeout}ms`);
  console.error(`  Mock Mode: ${config.mockMode}`);
  console.error(`  Retry Attempts: ${config.retryAttempts}`);
  console.error(`  Verbose: ${config.verbose}`);
}
