import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import { formatSuccessResponse, formatErrorResponse, createError, ErrorCode } from "../../utils/index.js";

/**
 * Input schema for the ping tool
 */
export const pingSchema = z.object({});

export type PingInput = z.infer<typeof pingSchema>;

/**
 * Create the ue_ping tool
 *
 * Tests connectivity to Unreal Engine.
 */
export function createPingTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_ping",
    description:
      "Test connectivity to Unreal Engine. Returns success if the Remote Control API is reachable.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
    handler: async (_args: PingInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { connected: true, mockMode: true },
          "Mock mode - simulated connection successful"
        );
      }

      const client = connectionManager.getHttpClient();
      const success = await client.ping();

      if (success) {
        return formatSuccessResponse(
          { connected: true, url: connectionManager.getConfig().httpUrl },
          "Successfully connected to Unreal Engine"
        );
      }

      return formatErrorResponse(
        createError(
          ErrorCode.CONNECTION_FAILED,
          `Could not connect to Unreal Engine at ${connectionManager.getConfig().httpUrl}`
        )
      );
    },
  };
}
