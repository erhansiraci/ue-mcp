/**
 * Default configuration values for the Unreal Engine MCP Server
 */
export const defaults = {
  /** Unreal Engine host address */
  host: "127.0.0.1",

  /** Remote Control HTTP API port */
  httpPort: 30010,

  /** Remote Control WebSocket port */
  wsPort: 30020,

  /** Request timeout in milliseconds */
  timeout: 5000,

  /** Enable mock mode (no UE connection required) */
  mockMode: false,

  /** Number of retry attempts for failed requests */
  retryAttempts: 3,

  /** Delay between retry attempts in milliseconds */
  retryDelay: 1000,

  /** Enable verbose logging */
  verbose: false,
} as const;

export type Defaults = typeof defaults;
