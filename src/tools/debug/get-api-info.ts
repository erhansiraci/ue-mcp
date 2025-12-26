import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the get_api_info tool
 */
export const getApiInfoSchema = z.object({});

export type GetApiInfoInput = z.infer<typeof getApiInfoSchema>;

/**
 * Create the ue_get_api_info tool
 *
 * Gets information about available Remote Control API routes.
 */
export function createGetApiInfoTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_get_api_info",
    description:
      "Get information about all available Remote Control API routes. " +
      "Useful for understanding what endpoints are available.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
    handler: async (_args: GetApiInfoInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse({
          Routes: [
            { Path: "/remote/object/call", Verb: "PUT" },
            { Path: "/remote/object/property", Verb: "PUT" },
            { Path: "/remote/object/describe", Verb: "PUT" },
            { Path: "/remote/batch", Verb: "PUT" },
            { Path: "/remote/presets", Verb: "GET" },
            { Path: "/remote/preset/{PresetName}", Verb: "GET" },
            { Path: "/remote/search/assets", Verb: "PUT" },
            { Path: "/remote/info", Verb: "GET" },
          ],
        });
      }

      const client = connectionManager.getHttpClient();
      const response = await client.getInfo();

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(response.data, "API information retrieved successfully");
    },
  };
}
