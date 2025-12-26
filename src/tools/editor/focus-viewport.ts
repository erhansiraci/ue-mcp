import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the focus_viewport tool
 */
export const focusViewportSchema = z.object({
  actorPath: z
    .string()
    .optional()
    .describe("Actor to focus on. If provided, centers viewport on this actor."),
  location: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional()
    .describe("Location to move the viewport camera to"),
});

export type FocusViewportInput = z.infer<typeof focusViewportSchema>;

/**
 * Create the ue_focus_viewport tool
 *
 * Moves the editor viewport to focus on an actor or location.
 */
export function createFocusViewportTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_focus_viewport",
    description:
      "Move the editor viewport to focus on a specific actor or location. " +
      "Useful for navigating to objects in large levels.",
    handler: async (args: FocusViewportInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          { focused: args.actorPath ?? args.location },
          `Mock: Viewport focused`
        );
      }

      const client = connectionManager.getHttpClient();

      if (args.actorPath) {
        // Focus on selected actor
        const selectResponse = await client.callFunction(
          "/Script/UnrealEd.Default__EditorActorSubsystem",
          "SetActorSelectionState",
          {
            Actor: args.actorPath,
            bShouldBeSelected: true,
          }
        );

        const selectError = handleApiResponse(selectResponse);
        if (selectError) {
          return formatErrorResponse(selectError);
        }

        // Execute focus command
        await client.callFunction(
          "/Script/Engine.Default__KismetSystemLibrary",
          "ExecuteConsoleCommand",
          {
            WorldContextObject: args.actorPath,
            Command: "CAMERA ALIGN",
          }
        );

        return formatSuccessResponse(
          { focusedOn: args.actorPath },
          `Viewport focused on actor`
        );
      }

      if (args.location) {
        // Set viewport camera location directly
        // This requires getting the level viewport client
        const response = await client.callFunction(
          "/Script/UnrealEd.Default__UnrealEditorSubsystem",
          "SetLevelViewportCameraInfo",
          {
            CameraLocation: {
              X: args.location.x,
              Y: args.location.y,
              Z: args.location.z,
            },
            CameraRotation: { Pitch: -30, Yaw: 0, Roll: 0 },
          }
        );

        const error = handleApiResponse(response);
        if (error) {
          return formatErrorResponse(error);
        }

        return formatSuccessResponse(
          { location: args.location },
          `Viewport moved to (${args.location.x}, ${args.location.y}, ${args.location.z})`
        );
      }

      return formatSuccessResponse(
        {},
        "No target specified - provide actorPath or location"
      );
    },
  };
}
