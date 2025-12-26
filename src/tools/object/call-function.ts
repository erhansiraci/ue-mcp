import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the call_function tool
 */
export const callFunctionSchema = z.object({
  objectPath: z
    .string()
    .describe(
      "Full path to the UObject (e.g., '/Game/Maps/Level.Level:PersistentLevel.Actor_1' " +
        "or '/Script/Engine.Default__KismetSystemLibrary' for static functions)"
    ),
  functionName: z
    .string()
    .describe("Name of the Blueprint-callable function to invoke"),
  parameters: z
    .record(z.unknown())
    .optional()
    .describe("Function parameters as key-value pairs"),
});

export type CallFunctionInput = z.infer<typeof callFunctionSchema>;

/**
 * Create the ue_call_function tool
 *
 * Calls a Blueprint-callable function on any UObject.
 */
export function createCallFunctionTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_call_function",
    description:
      "Call a Blueprint-callable function on a UObject. " +
      "This can invoke any function exposed to Blueprints, including actor methods, " +
      "engine utilities, and custom Blueprint functions. " +
      "Use ue_describe_object first to see available functions on an object.",
    inputSchema: {
      type: "object" as const,
      properties: {
        objectPath: {
          type: "string",
          description:
            "Full path to the UObject (e.g., '/Game/Maps/Level.Level:PersistentLevel.Actor_1' " +
            "or '/Script/Engine.Default__KismetSystemLibrary' for static functions)",
        },
        functionName: {
          type: "string",
          description: "Name of the Blueprint-callable function to invoke",
        },
        parameters: {
          type: "object",
          description: "Function parameters as key-value pairs",
          additionalProperties: true,
        },
      },
      required: ["objectPath", "functionName"],
    },
    handler: async (args: CallFunctionInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          {
            objectPath: args.objectPath,
            functionName: args.functionName,
            ReturnValue: null,
          },
          `Mock: Called ${args.functionName} on ${args.objectPath}`
        );
      }

      const client = connectionManager.getHttpClient();
      const response = await client.callFunction(
        args.objectPath,
        args.functionName,
        args.parameters
      );

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      return formatSuccessResponse(
        response.data,
        `Successfully called ${args.functionName}`
      );
    },
  };
}
