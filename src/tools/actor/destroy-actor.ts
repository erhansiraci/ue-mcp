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
 * Input schema for the destroy_actor tool
 */
export const destroyActorSchema = z.object({
  actorPath: z
    .string()
    .describe(
      "Full path to the actor to destroy. " +
      "Get actor paths using ue_get_all_actors or ue_get_selected_actors."
    ),
});

export type DestroyActorInput = z.infer<typeof destroyActorSchema>;

/**
 * Create the ue_destroy_actor tool
 *
 * Destroys (deletes) an actor from the level.
 */
export function createDestroyActorTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_destroy_actor",
    description:
      "Destroy (delete) an actor from the current level. " +
      "This action is irreversible (unless you undo in the editor). " +
      "Use ue_get_all_actors to find actor paths.",
    handler: async (args: DestroyActorInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { destroyed: args.actorPath },
          `Mock: Destroyed actor ${args.actorPath}`
        );
      }

      const client = connectionManager.getHttpClient();

      // Use EditorActorSubsystem.DestroyActor
      const response = await client.callFunction(
        "/Script/UnrealEd.Default__EditorActorSubsystem",
        "DestroyActor",
        {
          ActorToDestroy: args.actorPath,
        }
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const success = (response.data as { ReturnValue?: boolean })?.ReturnValue;

      if (!success) {
        return formatErrorResponse(
          createError(
            ErrorCode.UNREAL_ERROR,
            `Failed to destroy actor: ${args.actorPath}`
          )
        );
      }

      return formatSuccessResponse(
        { destroyed: args.actorPath },
        `Successfully destroyed actor`
      );
    },
  };
}
