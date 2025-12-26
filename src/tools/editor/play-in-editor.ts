import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the play_in_editor tool
 */
export const playInEditorSchema = z.object({
  action: z
    .enum(["start", "stop", "pause", "resume"])
    .describe("PIE action: start, stop, pause, or resume"),
});

export type PlayInEditorInput = z.infer<typeof playInEditorSchema>;

/**
 * Create the ue_play_in_editor tool
 *
 * Controls Play In Editor (PIE) mode.
 */
export function createPlayInEditorTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_play_in_editor",
    description:
      "Control Play In Editor (PIE) mode. Start, stop, pause, or resume game preview. " +
      "Useful for testing gameplay changes.",
    handler: async (args: PlayInEditorInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { action: args.action, success: true },
          `Mock: PIE ${args.action}`
        );
      }

      const client = connectionManager.getHttpClient();

      let functionName: string;
      let subsystem = "/Script/UnrealEd.Default__EditorLevelLibrary";

      switch (args.action) {
        case "start":
          functionName = "EditorPlaySimulate";
          break;
        case "stop":
          functionName = "EditorEndPlay";
          break;
        case "pause":
          functionName = "EditorSetPaused";
          break;
        case "resume":
          functionName = "EditorSetPaused";
          break;
      }

      const params =
        args.action === "pause"
          ? { bPaused: true }
          : args.action === "resume"
          ? { bPaused: false }
          : {};

      const response = await client.callFunction(subsystem, functionName, params);

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(
        { action: args.action, success: true },
        `PIE: ${args.action} executed`
      );
    },
  };
}
