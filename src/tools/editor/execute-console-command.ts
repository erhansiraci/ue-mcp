import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
  createError,
  ErrorCode,
} from "../../utils/index.js";

/**
 * Input schema for the execute_console_command tool
 */
export const executeConsoleCommandSchema = z.object({
  command: z
    .string()
    .describe(
      "The console command to execute (e.g., 'stat fps', 'show collision', 'r.ScreenPercentage 100')"
    ),
});

export type ExecuteConsoleCommandInput = z.infer<typeof executeConsoleCommandSchema>;

/**
 * Create the ue_execute_console_command tool
 *
 * Executes a console command in the editor.
 */
export function createExecuteConsoleCommandTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_execute_console_command",
    description:
      "Execute a console command in Unreal Engine. " +
      "Supports any command available in the editor console (~). " +
      "Common commands: 'stat fps', 'stat unit', 'show collision', 'viewmode wireframe'",
    handler: async (args: ExecuteConsoleCommandInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { command: args.command, executed: true },
          `Mock: Executed console command "${args.command}"`
        );
      }

      const client = connectionManager.getHttpClient();

      // Get the editor world first
      const worldResponse = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        "GetEditorWorld",
        {}
      );

      const worldPath = (worldResponse.data as { ReturnValue?: string })?.ReturnValue;

      if (!worldPath) {
        return formatErrorResponse(
          createError(ErrorCode.UNREAL_ERROR, "Could not get editor world")
        );
      }

      // Execute console command using KismetSystemLibrary
      const response = await client.callFunction(
        "/Script/Engine.Default__KismetSystemLibrary",
        "ExecuteConsoleCommand",
        {
          WorldContextObject: worldPath,
          Command: args.command,
        }
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(
        { command: args.command, executed: true },
        `Console command executed: ${args.command}`
      );
    },
  };
}
