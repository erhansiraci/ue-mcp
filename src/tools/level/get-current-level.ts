import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the get_current_level tool
 */
export const getCurrentLevelSchema = z.object({});

export type GetCurrentLevelInput = z.infer<typeof getCurrentLevelSchema>;

/**
 * Create the ue_get_current_level tool
 *
 * Gets information about the currently open level.
 */
export function createGetCurrentLevelTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_get_current_level",
    description:
      "Get information about the currently open level in the editor, " +
      "including its name, path, and world settings.",
    handler: async (_args: GetCurrentLevelInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse({
          levelName: "TestMap",
          levelPath: "/Game/Maps/TestMap",
          worldPath: "/Game/Maps/TestMap.TestMap",
          isPersistentLevel: true,
        });
      }

      const client = connectionManager.getHttpClient();

      // Get the current editor world
      const worldResponse = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        "GetEditorWorld",
        {}
      );

      const worldError = handleApiResponse(worldResponse);
      if (worldError) {
        return formatErrorResponse(worldError);
      }

      const worldPath = (worldResponse.data as { ReturnValue?: string })?.ReturnValue;

      // Get additional level info
      const levelResponse = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        "GetLevelPath",
        {}
      );

      const levelPath = (levelResponse.data as { ReturnValue?: string })?.ReturnValue;

      return formatSuccessResponse(
        {
          worldPath,
          levelPath,
          levelName: levelPath?.split("/").pop()?.replace(".umap", "") ?? "Unknown",
        },
        "Current level information retrieved"
      );
    },
  };
}
