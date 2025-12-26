/**
 * Type definitions for Unreal Engine Remote Control API
 */

/**
 * Response from the Remote Control API
 */
export interface RemoteControlResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** HTTP status code */
  statusCode: number;
}

/**
 * Request body for calling a function on a UObject
 */
export interface CallFunctionRequest {
  objectPath: string;
  functionName: string;
  parameters?: Record<string, unknown>;
  generateTransaction?: boolean;
}

/**
 * Request body for getting/setting a property
 */
export interface PropertyRequest {
  objectPath: string;
  propertyName: string;
  propertyValue?: Record<string, unknown>;
  access: "READ_ACCESS" | "WRITE_ACCESS";
}

/**
 * Request body for describing an object
 */
export interface DescribeObjectRequest {
  objectPath: string;
}

/**
 * Request body for batch operations
 */
export interface BatchRequest {
  RequestId: number;
  URL: string;
  Verb: "GET" | "PUT" | "DELETE";
  Body?: unknown;
}

/**
 * Response from batch operations
 */
export interface BatchResponse {
  Responses: Array<{
    RequestId: number;
    ResponseCode: number;
    ResponseBody?: unknown;
  }>;
}

/**
 * Object description response
 */
export interface ObjectDescription {
  Name: string;
  Class: string;
  Properties: PropertyInfo[];
  Functions: FunctionInfo[];
}

/**
 * Property information
 */
export interface PropertyInfo {
  Name: string;
  Type: string;
  Description?: string;
  Metadata?: Record<string, unknown>;
}

/**
 * Function information
 */
export interface FunctionInfo {
  Name: string;
  Description?: string;
  Parameters: ParameterInfo[];
  ReturnType?: string;
}

/**
 * Function parameter information
 */
export interface ParameterInfo {
  Name: string;
  Type: string;
  Description?: string;
  DefaultValue?: unknown;
}

/**
 * Preset information
 */
export interface PresetInfo {
  Name: string;
  Path: string;
  ID: string;
  Groups?: PresetGroup[];
}

/**
 * Preset group
 */
export interface PresetGroup {
  Name: string;
  ExposedProperties?: ExposedProperty[];
  ExposedFunctions?: ExposedFunction[];
}

/**
 * Exposed property in a preset
 */
export interface ExposedProperty {
  DisplayName: string;
  ID: string;
  UnderlyingProperty: {
    Name: string;
    Type: string;
  };
  OwnerObjects: string[];
}

/**
 * Exposed function in a preset
 */
export interface ExposedFunction {
  DisplayName: string;
  ID: string;
  UnderlyingFunction: {
    Name: string;
  };
  OwnerObjects: string[];
}

/**
 * API info response
 */
export interface ApiInfo {
  Routes: ApiRoute[];
}

/**
 * API route information
 */
export interface ApiRoute {
  Path: string;
  Verb: string;
  Description?: string;
}

/**
 * Transform data (location, rotation, scale)
 */
export interface Transform {
  Location?: Vector3;
  Rotation?: Rotator;
  Scale?: Vector3;
}

/**
 * 3D Vector
 */
export interface Vector3 {
  X: number;
  Y: number;
  Z: number;
}

/**
 * Rotation (Pitch, Yaw, Roll)
 */
export interface Rotator {
  Pitch: number;
  Yaw: number;
  Roll: number;
}

/**
 * Linear color
 */
export interface LinearColor {
  R: number;
  G: number;
  B: number;
  A: number;
}
