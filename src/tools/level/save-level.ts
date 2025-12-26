import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the save_level tool
 */
export const saveLevelSchema = z.object({});

export type SaveLevelInput = z.infer<typeof saveLevelSchema>;

/**
 * Create the ue_save_level tool
 *
 * Saves the current level.
 */
export function createSaveLevelTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_save_level",
    description:
      "Save the current level. This saves all changes made to the level.",
    handler: async (_args: SaveLevelInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { saved: true },
          "Mock: Level saved"
        );
      }

      const client = connectionManager.getHttpClient();

      const response = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        "SaveCurrentLevel",
        {}
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const success = (response.data as { ReturnValue?: boolean })?.ReturnValue;

      return formatSuccessResponse(
        { saved: success },
        success ? "Level saved successfully" : "Level may not have saved correctly"
      );
    },
  };
}
