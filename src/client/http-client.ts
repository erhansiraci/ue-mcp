import {
  RemoteControlResponse,
  CallFunctionRequest,
  BatchRequest,
  BatchResponse,
  ObjectDescription,
  PresetInfo,
  ApiInfo,
} from "./types.js";

/**
 * HTTP client for Unreal Engine Remote Control API
 *
 * Provides methods for all Remote Control HTTP endpoints.
 * Default port is 30010.
 */
export class UnrealHttpClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
  }

  /**
   * Call a function on a UObject
   *
   * @param objectPath - Full path to the object (e.g., "/Game/Maps/Level.Level:PersistentLevel.Actor_1")
   * @param functionName - Name of the function to call
   * @param parameters - Function parameters as key-value pairs
   */
  async callFunction(
    objectPath: string,
    functionName: string,
    parameters?: Record<string, unknown>
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>("/remote/object/call", {
      objectPath,
      functionName,
      parameters: parameters ?? {},
      generateTransaction: true,
    } satisfies CallFunctionRequest);
  }

  /**
   * Get a property value from a UObject
   *
   * @param objectPath - Full path to the object
   * @param propertyName - Name of the property to read
   */
  async getProperty(
    objectPath: string,
    propertyName: string
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>("/remote/object/property", {
      objectPath,
      propertyName,
      access: "READ_ACCESS",
    });
  }

  /**
   * Set a property value on a UObject
   *
   * @param objectPath - Full path to the object
   * @param propertyName - Name of the property to write
   * @param propertyValue - New value for the property
   */
  async setProperty(
    objectPath: string,
    propertyName: string,
    propertyValue: unknown
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>("/remote/object/property", {
      objectPath,
      propertyName,
      propertyValue: { [propertyName]: propertyValue },
      access: "WRITE_ACCESS",
    });
  }

  /**
   * Get description of a UObject (properties, functions, metadata)
   *
   * @param objectPath - Full path to the object
   */
  async describeObject(objectPath: string): Promise<RemoteControlResponse<ObjectDescription>> {
    return this.request<ObjectDescription>("/remote/object/describe", {
      objectPath,
    });
  }

  /**
   * Search for assets in the project
   *
   * @param query - Search query string
   * @param filter - Optional filters (class, path, etc.)
   */
  async searchAssets(
    query: string,
    filter?: Record<string, unknown>
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>("/remote/search/assets", {
      Query: query,
      ...filter,
    });
  }

  /**
   * Execute multiple operations in a single batch request
   *
   * @param requests - Array of batch requests
   */
  async batch(requests: Omit<BatchRequest, "RequestId">[]): Promise<RemoteControlResponse<BatchResponse>> {
    return this.request<BatchResponse>("/remote/batch", {
      Requests: requests.map((r, i) => ({
        RequestId: i + 1,
        URL: r.URL,
        Verb: r.Verb ?? "PUT",
        Body: r.Body,
      })),
    });
  }

  /**
   * Get information about available API routes
   */
  async getInfo(): Promise<RemoteControlResponse<ApiInfo>> {
    return this.request<ApiInfo>("/remote/info", undefined, "GET");
  }

  /**
   * Get list of all Remote Control Presets
   */
  async getPresets(): Promise<RemoteControlResponse<{ Presets: PresetInfo[] }>> {
    return this.request<{ Presets: PresetInfo[] }>("/remote/presets", undefined, "GET");
  }

  /**
   * Get details of a specific preset
   *
   * @param presetName - Name of the preset
   */
  async getPreset(presetName: string): Promise<RemoteControlResponse<PresetInfo>> {
    return this.request<PresetInfo>(
      `/remote/preset/${encodeURIComponent(presetName)}`,
      undefined,
      "GET"
    );
  }

  /**
   * Call a function exposed through a preset
   *
   * @param presetName - Name of the preset
   * @param functionName - Name of the exposed function
   * @param parameters - Function parameters
   */
  async callPresetFunction(
    presetName: string,
    functionName: string,
    parameters?: Record<string, unknown>
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>(
      `/remote/preset/${encodeURIComponent(presetName)}/function/${encodeURIComponent(functionName)}`,
      parameters ?? {}
    );
  }

  /**
   * Get a property exposed through a preset
   *
   * @param presetName - Name of the preset
   * @param propertyLabel - Label of the exposed property
   */
  async getPresetProperty(
    presetName: string,
    propertyLabel: string
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>(
      `/remote/preset/${encodeURIComponent(presetName)}/property/${encodeURIComponent(propertyLabel)}`,
      undefined,
      "GET"
    );
  }

  /**
   * Set a property exposed through a preset
   *
   * @param presetName - Name of the preset
   * @param propertyLabel - Label of the exposed property
   * @param value - New value
   */
  async setPresetProperty(
    presetName: string,
    propertyLabel: string,
    value: unknown
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>(
      `/remote/preset/${encodeURIComponent(presetName)}/property/${encodeURIComponent(propertyLabel)}`,
      { PropertyValue: value }
    );
  }

  /**
   * Get preset metadata
   *
   * @param presetName - Name of the preset
   * @param key - Optional specific metadata key
   */
  async getPresetMetadata(
    presetName: string,
    key?: string
  ): Promise<RemoteControlResponse> {
    const url = key
      ? `/remote/preset/${encodeURIComponent(presetName)}/metadata/${encodeURIComponent(key)}`
      : `/remote/preset/${encodeURIComponent(presetName)}/metadata`;
    return this.request<unknown>(url, undefined, "GET");
  }

  /**
   * Set preset metadata
   *
   * @param presetName - Name of the preset
   * @param key - Metadata key
   * @param value - Metadata value
   */
  async setPresetMetadata(
    presetName: string,
    key: string,
    value: string
  ): Promise<RemoteControlResponse> {
    return this.request<unknown>(
      `/remote/preset/${encodeURIComponent(presetName)}/metadata/${encodeURIComponent(key)}`,
      { Value: value }
    );
  }

  /**
   * Get thumbnail for an object
   *
   * @param objectPath - Path to the object
   */
  async getThumbnail(objectPath: string): Promise<RemoteControlResponse<string>> {
    return this.request<string>("/remote/object/thumbnail", {
      objectPath,
    });
  }

  /**
   * Make an HTTP request to the Remote Control API
   */
  private async request<T>(
    endpoint: string,
    body?: unknown,
    method: "GET" | "PUT" | "DELETE" = "PUT"
  ): Promise<RemoteControlResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      };

      if (body !== undefined && method !== "GET") {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      // Try to parse JSON response
      let data: T | undefined;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          data = (await response.json()) as T;
        } catch {
          data = undefined;
        }
      }

      if (!response.ok) {
        const errorData = data as Record<string, unknown> | undefined;
        return {
          success: false,
          statusCode: response.status,
          error: (errorData?.errorMessage as string) ?? response.statusText,
          data,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            statusCode: 408,
            error: `Request timeout after ${this.timeout}ms`,
          };
        }

        // Connection refused, network error, etc.
        return {
          success: false,
          statusCode: 0,
          error: error.message,
        };
      }

      return {
        success: false,
        statusCode: 0,
        error: "Unknown error occurred",
      };
    }
  }

  /**
   * Check if the server is reachable
   */
  async ping(): Promise<boolean> {
    const result = await this.getInfo();
    return result.success;
  }
}
