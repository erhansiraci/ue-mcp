import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the set_property tool
 */
export const setPropertySchema = z.object({
  objectPath: z
    .string()
    .describe("Full path to the UObject"),
  propertyName: z
    .string()
    .describe("Name of the property to write"),
  value: z
    .unknown()
    .describe(
      "New value for the property. Type must match the property type. " +
        "For structs, use an object with matching field names."
    ),
});

export type SetPropertyInput = z.infer<typeof setPropertySchema>;

/**
 * Create the ue_set_property tool
 *
 * Sets a property value on a UObject.
 */
export function createSetPropertyTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_set_property",
    description:
      "Write a property value on a UObject. " +
      "Can write any public property that isn't read-only and doesn't have a BlueprintSetter. " +
      "For properties with setters, use ue_call_function with the setter function instead. " +
      "Use ue_describe_object to see available properties and their types.",
    inputSchema: {
      type: "object" as const,
      properties: {
        objectPath: {
          type: "string",
          description: "Full path to the UObject",
        },
        propertyName: {
          type: "string",
          description: "Name of the property to write",
        },
        value: {
          description:
            "New value for the property. Type must match the property type. " +
            "For structs, use an object with matching field names.",
        },
      },
      required: ["objectPath", "propertyName", "value"],
    },
    handler: async (args: SetPropertyInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          {
            objectPath: args.objectPath,
            propertyName: args.propertyName,
            newValue: args.value,
          },
          `Mock: Set property ${args.propertyName}`
        );
      }

      const client = connectionManager.getHttpClient();
      const response = await client.setProperty(
        args.objectPath,
        args.propertyName,
        args.value
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(
        {
          objectPath: args.objectPath,
          propertyName: args.propertyName,
          newValue: args.value,
        },
        `Property ${args.propertyName} set successfully`
      );
    },
  };
}
