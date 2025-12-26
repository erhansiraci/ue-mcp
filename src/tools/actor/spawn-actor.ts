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
 * Input schema for the spawn_actor tool
 */
export const spawnActorSchema = z.object({
  className: z
    .string()
    .describe(
      "Class path of the actor to spawn. Examples: " +
      "'/Script/Engine.StaticMeshActor', '/Script/Engine.PointLight', " +
      "'/Script/Engine.CameraActor', or a Blueprint path like '/Game/Blueprints/BP_MyActor.BP_MyActor_C'"
    ),
  location: z
    .object({
      x: z.number().describe("X coordinate in world space"),
      y: z.number().describe("Y coordinate in world space"),
      z: z.number().describe("Z coordinate in world space"),
    })
    .describe("Spawn location in world coordinates"),
  rotation: z
    .object({
      pitch: z.number().default(0).describe("Pitch rotation in degrees"),
      yaw: z.number().default(0).describe("Yaw rotation in degrees"),
      roll: z.number().default(0).describe("Roll rotation in degrees"),
    })
    .optional()
    .describe("Optional rotation in degrees"),
  label: z
    .string()
    .optional()
    .describe("Optional label for the actor in the editor outliner"),
});

export type SpawnActorInput = z.infer<typeof spawnActorSchema>;

/**
 * Create the ue_spawn_actor tool
 *
 * Spawns a new actor in the current level.
 */
export function createSpawnActorTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_spawn_actor",
    description:
      "Spawn a new actor in the current level at the specified location. " +
      "Supports any actor class including built-in types (StaticMeshActor, PointLight, etc.) " +
      "and custom Blueprint actors. Returns the path to the newly created actor.",
    handler: async (args: SpawnActorInput) => {
      if (connectionManager.isMockMode()) {
        const mockPath = `/Game/Maps/MockMap.MockMap:PersistentLevel.${args.className.split(".").pop()}_${Date.now()}`;
        return formatSuccessResponse(
          {
            actorPath: mockPath,
            className: args.className,
            location: args.location,
            rotation: args.rotation ?? { pitch: 0, yaw: 0, roll: 0 },
          },
          `Mock: Spawned ${args.className} at (${args.location.x}, ${args.location.y}, ${args.location.z})`
        );
      }

      const client = connectionManager.getHttpClient();

      // Use EditorActorSubsystem.SpawnActorFromClass
      const response = await client.callFunction(
        "/Script/UnrealEd.Default__EditorActorSubsystem",
        "SpawnActorFromClass",
        {
          ActorClass: args.className,
          Location: {
            X: args.location.x,
            Y: args.location.y,
            Z: args.location.z,
          },
          Rotation: args.rotation
            ? {
                Pitch: args.rotation.pitch,
                Yaw: args.rotation.yaw,
                Roll: args.rotation.roll,
              }
            : { Pitch: 0, Yaw: 0, Roll: 0 },
        }
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const actorPath = (response.data as { ReturnValue?: string })?.ReturnValue;

      if (!actorPath) {
        return formatErrorResponse(
          createError(
            ErrorCode.UNREAL_ERROR,
            "Actor was not spawned - no path returned"
          )
        );
      }

      // Set label if provided
      if (args.label) {
        await client.callFunction(actorPath, "SetActorLabel", {
          NewActorLabel: args.label,
        });
      }

      return formatSuccessResponse(
        {
          actorPath,
          className: args.className,
          location: args.location,
          rotation: args.rotation ?? { pitch: 0, yaw: 0, roll: 0 },
          label: args.label,
        },
        `Successfully spawned ${args.className.split(".").pop()} at (${args.location.x}, ${args.location.y}, ${args.location.z})`
      );
    },
  };
}
