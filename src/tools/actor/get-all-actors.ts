import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the get_all_actors tool
 */
export const getAllActorsSchema = z.object({
  classFilter: z
    .string()
    .optional()
    .describe(
      "Optional class name to filter actors (e.g., 'StaticMeshActor', 'PointLight'). " +
      "Leave empty to get all actors."
    ),
});

export type GetAllActorsInput = z.infer<typeof getAllActorsSchema>;

/**
 * Create the ue_get_all_actors tool
 *
 * Lists all actors in the current level.
 */
export function createGetAllActorsTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_get_all_actors",
    description:
      "Get a list of all actors in the current level. " +
      "Optionally filter by class name to get only specific actor types. " +
      "Returns actor paths that can be used with other tools like ue_get_property or ue_call_function.",
    handler: async (args: GetAllActorsInput) => {
      if (connectionManager.isMockMode()) {
        const mockActors = [
          "/Game/Maps/TestMap.TestMap:PersistentLevel.StaticMeshActor_1",
          "/Game/Maps/TestMap.TestMap:PersistentLevel.PointLight_1",
          "/Game/Maps/TestMap.TestMap:PersistentLevel.PlayerStart_1",
          "/Game/Maps/TestMap.TestMap:PersistentLevel.DirectionalLight_1",
        ];

        const filtered = args.classFilter
          ? mockActors.filter((a) => a.includes(args.classFilter!))
          : mockActors;

        return formatSuccessResponse(
          { actors: filtered, count: filtered.length },
          `Mock: Found ${filtered.length} actors`
        );
      }

      const client = connectionManager.getHttpClient();

      // Call EditorLevelLibrary.GetAllLevelActors or filter by class
      const functionName = args.classFilter
        ? "GetAllLevelActorsOfClass"
        : "GetAllLevelActors";

      const params = args.classFilter
        ? { ActorClass: `/Script/Engine.${args.classFilter}` }
        : {};

      const response = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        functionName,
        params
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const actors = (response.data as { ReturnValue?: string[] })?.ReturnValue ?? [];

      return formatSuccessResponse(
        { actors, count: actors.length },
        `Found ${actors.length} actors in the level`
      );
    },
  };
}
