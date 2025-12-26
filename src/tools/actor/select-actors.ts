import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the select_actors tool
 */
export const selectActorsSchema = z.object({
  actorPaths: z
    .array(z.string())
    .describe("Array of actor paths to select"),
  addToSelection: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, adds to current selection. If false (default), replaces selection."),
});

export type SelectActorsInput = z.infer<typeof selectActorsSchema>;

/**
 * Create the ue_select_actors tool
 *
 * Sets the editor selection to specified actors.
 */
export function createSelectActorsTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_select_actors",
    description:
      "Select actors in the Unreal Editor. By default, replaces the current selection. " +
      "Set addToSelection=true to add to the existing selection instead.",
    handler: async (args: SelectActorsInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          {
            selected: args.actorPaths,
            count: args.actorPaths.length,
            addedToSelection: args.addToSelection,
          },
          `Mock: Selected ${args.actorPaths.length} actor(s)`
        );
      }

      const client = connectionManager.getHttpClient();

      // Clear selection first if not adding
      if (!args.addToSelection) {
        await client.callFunction(
          "/Script/UnrealEd.Default__EditorActorSubsystem",
          "ClearActorSelectionSet",
          {}
        );
      }

      // Select each actor
      for (const actorPath of args.actorPaths) {
        const response = await client.callFunction(
          "/Script/UnrealEd.Default__EditorActorSubsystem",
          "SetActorSelectionState",
          {
            Actor: actorPath,
            bShouldBeSelected: true,
          }
        );

        const error = handleApiResponse(response);
        if (error) {
          // Continue with other actors even if one fails
          console.error(`Failed to select actor: ${actorPath}`);
        }
      }

      return formatSuccessResponse(
        {
          selected: args.actorPaths,
          count: args.actorPaths.length,
          addedToSelection: args.addToSelection,
        },
        `Selected ${args.actorPaths.length} actor(s)`
      );
    },
  };
}
