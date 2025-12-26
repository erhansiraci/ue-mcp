import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the get_property tool
 */
export const getPropertySchema = z.object({
  objectPath: z
    .string()
    .describe("Full path to the UObject"),
  propertyName: z
    .string()
    .describe("Name of the property to read"),
});

export type GetPropertyInput = z.infer<typeof getPropertySchema>;

/**
 * Create the ue_get_property tool
 *
 * Reads a property value from a UObject.
 */
export function createGetPropertyTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_get_property",
    description:
      "Read a property value from a UObject. " +
      "Can read any public property that doesn't have a BlueprintGetter defined. " +
      "For properties with getters, use ue_call_function instead. " +
      "Use ue_describe_object to see available properties on an object.",
    inputSchema: {
      type: "object" as const,
      properties: {
        objectPath: {
          type: "string",
          description: "Full path to the UObject",
        },
        propertyName: {
          type: "string",
          description: "Name of the property to read",
        },
      },
      required: ["objectPath", "propertyName"],
    },
    handler: async (args: GetPropertyInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          {
            objectPath: args.objectPath,
            propertyName: args.propertyName,
            value: null,
          },
          `Mock: Read property ${args.propertyName}`
        );
      }

      const client = connectionManager.getHttpClient();
      const response = await client.getProperty(args.objectPath, args.propertyName);

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(
        {
          objectPath: args.objectPath,
          propertyName: args.propertyName,
          value: response.data,
        },
        `Property ${args.propertyName} read successfully`
      );
    },
  };
}
