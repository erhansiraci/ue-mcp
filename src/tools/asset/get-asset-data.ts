import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the get_asset_data tool
 */
export const getAssetDataSchema = z.object({
  assetPath: z
    .string()
    .describe("Full path to the asset (e.g., '/Game/Characters/BP_Character')"),
});

export type GetAssetDataInput = z.infer<typeof getAssetDataSchema>;

/**
 * Create the ue_get_asset_data tool
 *
 * Gets metadata and information about an asset.
 */
export function createGetAssetDataTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_get_asset_data",
    description:
      "Get detailed metadata about an asset including its class, size, and references. " +
      "Use ue_search_assets to find asset paths first.",
    handler: async (args: GetAssetDataInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse({
          path: args.assetPath,
          class: "StaticMesh",
          package: args.assetPath.split("/").slice(0, -1).join("/"),
          name: args.assetPath.split("/").pop(),
          diskSize: 1024000,
          memorySize: 512000,
        });
      }

      const client = connectionManager.getHttpClient();

      // Use describe to get asset information
      const response = await client.describeObject(args.assetPath);

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(
        {
          path: args.assetPath,
          ...response.data,
        },
        `Asset data for ${args.assetPath}`
      );
    },
  };
}
