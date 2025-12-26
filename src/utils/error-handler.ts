/**
 * Error handling utilities for the MCP server
 */

import { RemoteControlResponse } from "../client/types.js";

/**
 * Error codes for categorizing errors
 */
export enum ErrorCode {
  CONNECTION_FAILED = "CONNECTION_FAILED",
  TIMEOUT = "TIMEOUT",
  INVALID_OBJECT_PATH = "INVALID_OBJECT_PATH",
  FUNCTION_NOT_FOUND = "FUNCTION_NOT_FOUND",
  PROPERTY_NOT_FOUND = "PROPERTY_NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  UNREAL_ERROR = "UNREAL_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Structured error with metadata
 */
export interface McpError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  recoverable: boolean;
  suggestion?: string;
}

/**
 * Error information by error code
 */
const ERROR_INFO: Record<ErrorCode, { recoverable: boolean; suggestion?: string }> = {
  [ErrorCode.CONNECTION_FAILED]: {
    recoverable: true,
    suggestion:
      "Ensure Unreal Engine is running with Remote Control plugin enabled. " +
      "Enable it via Edit > Plugins > Remote Control API. " +
      "The server listens on port 30010 by default.",
  },
  [ErrorCode.TIMEOUT]: {
    recoverable: true,
    suggestion:
      "The request timed out. Try increasing the timeout with UE_TIMEOUT environment variable, " +
      "or check if Unreal Engine is responsive.",
  },
  [ErrorCode.INVALID_OBJECT_PATH]: {
    recoverable: false,
    suggestion:
      "The object path was not found. Use ue_get_all_actors to list available actors, " +
      "or verify the object exists in the current level.",
  },
  [ErrorCode.FUNCTION_NOT_FOUND]: {
    recoverable: false,
    suggestion:
      "The function was not found on this object. Use ue_describe_object to see available " +
      "Blueprint-callable functions. Note: only functions exposed to Blueprints can be called.",
  },
  [ErrorCode.PROPERTY_NOT_FOUND]: {
    recoverable: false,
    suggestion:
      "The property was not found. Use ue_describe_object to see available properties. " +
      "Note: private/protected properties cannot be accessed via Remote Control.",
  },
  [ErrorCode.PERMISSION_DENIED]: {
    recoverable: false,
    suggestion:
      "This operation is not permitted. The property may be read-only, or the function " +
      "may have access restrictions. Check the UE output log for details.",
  },
  [ErrorCode.INVALID_PARAMETERS]: {
    recoverable: false,
    suggestion:
      "The provided parameters are invalid. Check the parameter types and values match " +
      "the expected schema. Use ue_describe_object to see function signatures.",
  },
  [ErrorCode.UNREAL_ERROR]: {
    recoverable: false,
    suggestion:
      "Unreal Engine returned an error. Check the Unreal Engine output log for details. " +
      "The operation may have partially succeeded.",
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    recoverable: false,
    suggestion: "An unexpected error occurred. Check the logs for more details.",
  },
};

/**
 * Create a structured error
 */
export function createError(
  code: ErrorCode,
  message: string,
  details?: unknown
): McpError {
  const info = ERROR_INFO[code];
  return {
    code,
    message,
    details,
    ...info,
  };
}

/**
 * Format an error for MCP tool response
 */
export function formatErrorResponse(error: McpError): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  const lines = [`Error: ${error.message}`, `Code: ${error.code}`];

  if (error.suggestion) {
    lines.push("", `Suggestion: ${error.suggestion}`);
  }

  if (error.details) {
    lines.push("", `Details: ${JSON.stringify(error.details, null, 2)}`);
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
    isError: true,
  };
}

/**
 * Convert a Remote Control API response to an error (if failed)
 */
export function handleApiResponse(response: RemoteControlResponse): McpError | null {
  if (response.success) return null;

  // Connection failed (fetch error)
  if (response.statusCode === 0) {
    return createError(
      ErrorCode.CONNECTION_FAILED,
      response.error ?? "Could not connect to Unreal Engine",
      { statusCode: response.statusCode }
    );
  }

  // Timeout
  if (response.statusCode === 408) {
    return createError(ErrorCode.TIMEOUT, response.error ?? "Request timed out");
  }

  // Not found
  if (response.statusCode === 404) {
    // Try to determine if it's an object or function/property not found
    const errorLower = response.error?.toLowerCase() ?? "";
    if (errorLower.includes("function")) {
      return createError(
        ErrorCode.FUNCTION_NOT_FOUND,
        response.error ?? "Function not found"
      );
    }
    if (errorLower.includes("property")) {
      return createError(
        ErrorCode.PROPERTY_NOT_FOUND,
        response.error ?? "Property not found"
      );
    }
    return createError(
      ErrorCode.INVALID_OBJECT_PATH,
      response.error ?? "Object not found"
    );
  }

  // Bad request
  if (response.statusCode === 400) {
    return createError(
      ErrorCode.INVALID_PARAMETERS,
      response.error ?? "Invalid parameters",
      response.data
    );
  }

  // Forbidden
  if (response.statusCode === 403) {
    return createError(
      ErrorCode.PERMISSION_DENIED,
      response.error ?? "Permission denied"
    );
  }

  // Other errors
  return createError(
    ErrorCode.UNREAL_ERROR,
    response.error ?? "Unreal Engine returned an error",
    { statusCode: response.statusCode, data: response.data }
  );
}

/**
 * Format a successful response for MCP tool output
 */
export function formatSuccessResponse(
  data: unknown,
  message?: string
): { content: Array<{ type: "text"; text: string }> } {
  const output: Record<string, unknown> = {};

  if (message) {
    output.message = message;
  }

  if (data !== undefined && data !== null) {
    output.data = data;
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(output, null, 2),
      },
    ],
  };
}
