import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the describe_object tool
 */
export const describeObjectSchema = z.object({
  objectPath: z
    .string()
    .describe("Full path to the UObject to describe"),
});

export type DescribeObjectInput = z.infer<typeof describeObjectSchema>;

/**
 * Create the ue_describe_object tool
 *
 * Gets detailed information about a UObject.
 */
export function createDescribeObjectTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_describe_object",
    description:
      "Get detailed metadata about a UObject, including all accessible properties " +
      "and Blueprint-callable functions. " +
      "Use this to discover what operations are available on an object before " +
      "calling ue_call_function, ue_get_property, or ue_set_property.",
    inputSchema: {
      type: "object" as const,
      properties: {
        objectPath: {
          type: "string",
          description: "Full path to the UObject to describe",
        },
      },
      required: ["objectPath"],
    },
    handler: async (args: DescribeObjectInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse({
          Name: args.objectPath.split(".").pop(),
          Class: "MockActor",
          Properties: [
            { Name: "RelativeLocation", Type: "FVector" },
            { Name: "RelativeRotation", Type: "FRotator" },
            { Name: "RelativeScale3D", Type: "FVector" },
          ],
          Functions: [
            { Name: "SetActorLocation", Parameters: [{ Name: "NewLocation", Type: "FVector" }] },
            { Name: "SetActorRotation", Parameters: [{ Name: "NewRotation", Type: "FRotator" }] },
            { Name: "GetActorLocation", Parameters: [], ReturnType: "FVector" },
          ],
        });
      }

      const client = connectionManager.getHttpClient();
      const response = await client.describeObject(args.objectPath);

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(
        response.data,
        `Description for ${args.objectPath}`
      );
    },
  };
}
