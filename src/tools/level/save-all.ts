import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the save_all tool
 */
export const saveAllSchema = z.object({});

export type SaveAllInput = z.infer<typeof saveAllSchema>;

/**
 * Create the ue_save_all tool
 *
 * Saves all modified assets and levels.
 */
export function createSaveAllTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_save_all",
    description:
      "Save all modified assets and levels. Equivalent to Ctrl+Shift+S in the editor.",
    handler: async (_args: SaveAllInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { saved: true },
          "Mock: All assets saved"
        );
      }

      const client = connectionManager.getHttpClient();

      const response = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        "SaveAllDirtyLevels",
        {}
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const success = (response.data as { ReturnValue?: boolean })?.ReturnValue ?? true;

      return formatSuccessResponse(
        { saved: success },
        "All modified assets saved"
      );
    },
  };
}
