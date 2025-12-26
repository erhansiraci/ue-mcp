import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the get_selected_actors tool
 */
export const getSelectedActorsSchema = z.object({});

export type GetSelectedActorsInput = z.infer<typeof getSelectedActorsSchema>;

/**
 * Create the ue_get_selected_actors tool
 *
 * Gets the currently selected actors in the editor.
 */
export function createGetSelectedActorsTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_get_selected_actors",
    description:
      "Get the list of currently selected actors in the Unreal Editor. " +
      "Useful for performing operations on user-selected objects. " +
      "Returns actor paths that can be used with other tools.",
    handler: async (_args: GetSelectedActorsInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { actors: [], count: 0 },
          "Mock: No actors selected"
        );
      }

      const client = connectionManager.getHttpClient();

      const response = await client.callFunction(
        "/Script/UnrealEd.Default__EditorActorSubsystem",
        "GetSelectedLevelActors",
        {}
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const actors = (response.data as { ReturnValue?: string[] })?.ReturnValue ?? [];

      return formatSuccessResponse(
        { actors, count: actors.length },
        actors.length > 0
          ? `${actors.length} actor(s) selected`
          : "No actors selected"
      );
    },
  };
}
