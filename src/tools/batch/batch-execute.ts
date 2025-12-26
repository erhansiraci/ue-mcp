import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Single operation in a batch request
 */
const batchOperationSchema = z.object({
  type: z
    .enum(["call", "get", "set"])
    .describe("Operation type: 'call' for function, 'get' for read property, 'set' for write property"),
  objectPath: z.string().describe("Path to the UObject"),
  target: z.string().describe("Function name (for 'call') or property name (for 'get'/'set')"),
  value: z.unknown().optional().describe("Value for 'set' operations or parameters for 'call'"),
});

/**
 * Input schema for the batch_execute tool
 */
export const batchExecuteSchema = z.object({
  operations: z
    .array(batchOperationSchema)
    .min(1)
    .max(100)
    .describe("Array of operations to execute in a single batch request"),
});

export type BatchExecuteInput = z.infer<typeof batchExecuteSchema>;

/**
 * Create the ue_batch_execute tool
 *
 * Executes multiple operations in a single batch request for efficiency.
 */
export function createBatchExecuteTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_batch_execute",
    description:
      "Execute multiple operations in a single batch request. " +
      "More efficient than calling individual tools when you need to perform many operations. " +
      "Supports function calls, property reads, and property writes. " +
      "Maximum 100 operations per batch.",
    handler: async (args: BatchExecuteInput) => {
      if (connectionManager.isMockMode()) {
        return formatSuccessResponse(
          {
            results: args.operations.map((op, i) => ({
              requestId: i + 1,
              success: true,
              operation: op.type,
              target: op.target,
            })),
            totalOperations: args.operations.length,
            successful: args.operations.length,
            failed: 0,
          },
          `Mock: Executed ${args.operations.length} operations`
        );
      }

      const client = connectionManager.getHttpClient();

      // Build batch requests
      const batchRequests = args.operations.map((op) => {
        switch (op.type) {
          case "call":
            return {
              URL: "/remote/object/call",
              Verb: "PUT" as const,
              Body: {
                objectPath: op.objectPath,
                functionName: op.target,
                parameters: op.value ?? {},
                generateTransaction: true,
              },
            };
          case "get":
            return {
              URL: "/remote/object/property",
              Verb: "PUT" as const,
              Body: {
                objectPath: op.objectPath,
                propertyName: op.target,
                access: "READ_ACCESS",
              },
            };
          case "set":
            return {
              URL: "/remote/object/property",
              Verb: "PUT" as const,
              Body: {
                objectPath: op.objectPath,
                propertyName: op.target,
                propertyValue: { [op.target]: op.value },
                access: "WRITE_ACCESS",
              },
            };
        }
      });

      const response = await client.batch(batchRequests);

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const batchData = response.data;
      const responses = batchData?.Responses ?? [];

      const results = responses.map((r, i) => ({
        requestId: r.RequestId,
        success: r.ResponseCode >= 200 && r.ResponseCode < 300,
        responseCode: r.ResponseCode,
        operation: args.operations[i].type,
        target: args.operations[i].target,
        data: r.ResponseBody,
      }));

      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      return formatSuccessResponse(
        {
          results,
          totalOperations: args.operations.length,
          successful,
          failed,
        },
        `Executed ${args.operations.length} operations: ${successful} successful, ${failed} failed`
      );
    },
  };
}
