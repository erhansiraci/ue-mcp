import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the transform_actor tool
 */
export const transformActorSchema = z.object({
  actorPath: z
    .string()
    .describe("Full path to the actor to transform"),
  location: z
    .object({
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
    })
    .optional()
    .describe("New world location. If not provided, location remains unchanged."),
  rotation: z
    .object({
      pitch: z.number().describe("Pitch in degrees"),
      yaw: z.number().describe("Yaw in degrees"),
      roll: z.number().describe("Roll in degrees"),
    })
    .optional()
    .describe("New rotation in degrees. If not provided, rotation remains unchanged."),
  scale: z
    .object({
      x: z.number().describe("X scale factor"),
      y: z.number().describe("Y scale factor"),
      z: z.number().describe("Z scale factor"),
    })
    .optional()
    .describe("New scale. If not provided, scale remains unchanged."),
});

export type TransformActorInput = z.infer<typeof transformActorSchema>;

/**
 * Create the ue_transform_actor tool
 *
 * Sets the transform (location, rotation, scale) of an actor.
 */
export function createTransformActorTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_transform_actor",
    description:
      "Set the transform (location, rotation, and/or scale) of an actor. " +
      "You can provide any combination of location, rotation, and scale - " +
      "only the provided components will be changed.",
    handler: async (args: TransformActorInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          {
            actorPath: args.actorPath,
            location: args.location,
            rotation: args.rotation,
            scale: args.scale,
          },
          `Mock: Transformed actor ${args.actorPath}`
        );
      }

      const client = connectionManager.getHttpClient();
      const results: Record<string, unknown> = { actorPath: args.actorPath };

      // Set location if provided
      if (args.location) {
        const locResponse = await client.callFunction(
          args.actorPath,
          "K2_SetActorLocation",
          {
            NewLocation: {
              X: args.location.x,
              Y: args.location.y,
              Z: args.location.z,
            },
            bSweep: false,
            bTeleport: true,
          }
        );

        const locError = handleApiResponse(locResponse);
        if (locError) {
          return formatErrorResponse(locError);
        }
        results.location = args.location;
      }

      // Set rotation if provided
      if (args.rotation) {
        const rotResponse = await client.callFunction(
          args.actorPath,
          "K2_SetActorRotation",
          {
            NewRotation: {
              Pitch: args.rotation.pitch,
              Yaw: args.rotation.yaw,
              Roll: args.rotation.roll,
            },
            bTeleportPhysics: true,
          }
        );

        const rotError = handleApiResponse(rotResponse);
        if (rotError) {
          return formatErrorResponse(rotError);
        }
        results.rotation = args.rotation;
      }

      // Set scale if provided
      if (args.scale) {
        const scaleResponse = await client.callFunction(
          args.actorPath,
          "SetActorScale3D",
          {
            NewScale3D: {
              X: args.scale.x,
              Y: args.scale.y,
              Z: args.scale.z,
            },
          }
        );

        const scaleError = handleApiResponse(scaleResponse);
        if (scaleError) {
          return formatErrorResponse(scaleError);
        }
        results.scale = args.scale;
      }

      const changes = [
        args.location ? "location" : null,
        args.rotation ? "rotation" : null,
        args.scale ? "scale" : null,
      ].filter(Boolean);

      return formatSuccessResponse(
        results,
        `Successfully set ${changes.join(", ")} on actor`
      );
    },
  };
}
