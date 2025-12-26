import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the open_level tool
 */
export const openLevelSchema = z.object({
  levelPath: z
    .string()
    .describe(
      "Path to the level to open (e.g., '/Game/Maps/MyLevel'). " +
      "Do not include the .umap extension."
    ),
});

export type OpenLevelInput = z.infer<typeof openLevelSchema>;

/**
 * Create the ue_open_level tool
 *
 * Opens a level in the editor.
 */
export function createOpenLevelTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_open_level",
    description:
      "Open a level in the Unreal Editor. This will close the current level. " +
      "Use ue_search_assets with classFilter='World' to find available levels.",
    handler: async (args: OpenLevelInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { levelPath: args.levelPath, opened: true },
          `Mock: Opened level ${args.levelPath}`
        );
      }

      const client = connectionManager.getHttpClient();

      const response = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        "LoadLevel",
        {
          AssetPath: args.levelPath,
        }
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const success = (response.data as { ReturnValue?: boolean })?.ReturnValue;

      return formatSuccessResponse(
        { levelPath: args.levelPath, opened: success },
        success
          ? `Successfully opened level: ${args.levelPath}`
          : `Level may not have opened correctly`
      );
    },
  };
}
