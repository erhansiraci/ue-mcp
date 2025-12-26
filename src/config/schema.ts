import { z } from "zod";

/**
 * Configuration validation schema using Zod
 */
export const configSchema = z.object({
  /** Unreal Engine host address */
  host: z.string().min(1).default("127.0.0.1"),

  /** Remote Control HTTP API port */
  httpPort: z.number().min(1).max(65535).default(30010),

  /** Remote Control WebSocket port */
  wsPort: z.number().min(1).max(65535).default(30020),

  /** Request timeout in milliseconds */
  timeout: z.number().min(100).max(60000).default(5000),

  /** Enable mock mode (no UE connection required) */
  mockMode: z.boolean().default(false),

  /** Number of retry attempts for failed requests */
  retryAttempts: z.number().min(0).max(10).default(3),

  /** Delay between retry attempts in milliseconds */
  retryDelay: z.number().min(100).max(10000).default(1000),

  /** Enable verbose logging */
  verbose: z.boolean().default(false),
});

export type ConfigSchema = z.infer<typeof configSchema>;

/**
 * Extended config with derived URLs
 */
export interface Config extends ConfigSchema {
  /** Full HTTP URL for Remote Control API */
  httpUrl: string;

  /** Full WebSocket URL for subscriptions */
  wsUrl: string;
}
