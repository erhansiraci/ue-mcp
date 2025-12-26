/**
 * Tool registry
 *
 * Registers all MCP tools with the server.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConnectionManager } from "../client/index.js";

// Debug tools
import { createPingTool } from "./debug/ping.js";
import { createGetApiInfoTool } from "./debug/get-api-info.js";

// Object tools
import { createCallFunctionTool } from "./object/call-function.js";
import { createGetPropertyTool } from "./object/get-property.js";
import { createSetPropertyTool } from "./object/set-property.js";
import { createDescribeObjectTool } from "./object/describe-object.js";

// Actor tools
import { createGetAllActorsTool } from "./actor/get-all-actors.js";
import { createGetSelectedActorsTool } from "./actor/get-selected-actors.js";
import { createSpawnActorTool } from "./actor/spawn-actor.js";
import { createDestroyActorTool } from "./actor/destroy-actor.js";
import { createTransformActorTool } from "./actor/transform-actor.js";
import { createSelectActorsTool } from "./actor/select-actors.js";

// Batch tools
import { createBatchExecuteTool } from "./batch/batch-execute.js";

// Asset tools
import { createSearchAssetsTool } from "./asset/search-assets.js";
import { createGetAssetDataTool } from "./asset/get-asset-data.js";

// Level tools
import { createGetCurrentLevelTool } from "./level/get-current-level.js";
import { createOpenLevelTool } from "./level/open-level.js";
import { createSaveLevelTool } from "./level/save-level.js";
import { createSaveAllTool } from "./level/save-all.js";

// Editor tools
import { createPlayInEditorTool } from "./editor/play-in-editor.js";
import { createExecuteConsoleCommandTool } from "./editor/execute-console-command.js";
import { createFocusViewportTool } from "./editor/focus-viewport.js";

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer, connectionManager: ConnectionManager): void {
  let toolCount = 0;

  // ========== DEBUG TOOLS ==========
  const pingTool = createPingTool(connectionManager);
  server.tool(pingTool.name, pingTool.description, {}, async () => pingTool.handler({}));
  toolCount++;

  const apiInfoTool = createGetApiInfoTool(connectionManager);
  server.tool(apiInfoTool.name, apiInfoTool.description, {}, async () => apiInfoTool.handler({}));
  toolCount++;

  // ========== OBJECT TOOLS ==========
  const callFunctionTool = createCallFunctionTool(connectionManager);
  server.tool(
    callFunctionTool.name,
    callFunctionTool.description,
    {
      objectPath: z.string().describe("Full path to the UObject"),
      functionName: z.string().describe("Name of the Blueprint-callable function"),
      parameters: z.record(z.unknown()).optional().describe("Function parameters"),
    },
    async (args) => callFunctionTool.handler(args)
  );
  toolCount++;

  const getPropertyTool = createGetPropertyTool(connectionManager);
  server.tool(
    getPropertyTool.name,
    getPropertyTool.description,
    {
      objectPath: z.string().describe("Full path to the UObject"),
      propertyName: z.string().describe("Name of the property to read"),
    },
    async (args) => getPropertyTool.handler(args)
  );
  toolCount++;

  const setPropertyTool = createSetPropertyTool(connectionManager);
  server.tool(
    setPropertyTool.name,
    setPropertyTool.description,
    {
      objectPath: z.string().describe("Full path to the UObject"),
      propertyName: z.string().describe("Name of the property to write"),
      value: z.unknown().describe("New value for the property"),
    },
    async (args) => setPropertyTool.handler(args)
  );
  toolCount++;

  const describeObjectTool = createDescribeObjectTool(connectionManager);
  server.tool(
    describeObjectTool.name,
    describeObjectTool.description,
    {
      objectPath: z.string().describe("Full path to the UObject to describe"),
    },
    async (args) => describeObjectTool.handler(args)
  );
  toolCount++;

  // ========== ACTOR TOOLS ==========
  const getAllActorsTool = createGetAllActorsTool(connectionManager);
  server.tool(
    getAllActorsTool.name,
    getAllActorsTool.description,
    {
      classFilter: z.string().optional().describe("Optional class name to filter actors"),
    },
    async (args) => getAllActorsTool.handler(args)
  );
  toolCount++;

  const getSelectedActorsTool = createGetSelectedActorsTool(connectionManager);
  server.tool(
    getSelectedActorsTool.name,
    getSelectedActorsTool.description,
    {},
    async () => getSelectedActorsTool.handler({})
  );
  toolCount++;

  const spawnActorTool = createSpawnActorTool(connectionManager);
  server.tool(
    spawnActorTool.name,
    spawnActorTool.description,
    {
      className: z.string().describe("Class path of the actor to spawn"),
      location: z.object({
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
        z: z.number().describe("Z coordinate"),
      }).describe("Spawn location"),
      rotation: z.object({
        pitch: z.number().default(0),
        yaw: z.number().default(0),
        roll: z.number().default(0),
      }).optional().describe("Optional rotation in degrees"),
      label: z.string().optional().describe("Optional label for the actor"),
    },
    async (args) => spawnActorTool.handler(args)
  );
  toolCount++;

  const destroyActorTool = createDestroyActorTool(connectionManager);
  server.tool(
    destroyActorTool.name,
    destroyActorTool.description,
    {
      actorPath: z.string().describe("Full path to the actor to destroy"),
    },
    async (args) => destroyActorTool.handler(args)
  );
  toolCount++;

  const transformActorTool = createTransformActorTool(connectionManager);
  server.tool(
    transformActorTool.name,
    transformActorTool.description,
    {
      actorPath: z.string().describe("Full path to the actor"),
      location: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).optional().describe("New world location"),
      rotation: z.object({
        pitch: z.number(),
        yaw: z.number(),
        roll: z.number(),
      }).optional().describe("New rotation in degrees"),
      scale: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).optional().describe("New scale"),
    },
    async (args) => transformActorTool.handler(args)
  );
  toolCount++;

  const selectActorsTool = createSelectActorsTool(connectionManager);
  server.tool(
    selectActorsTool.name,
    selectActorsTool.description,
    {
      actorPaths: z.array(z.string()).describe("Array of actor paths to select"),
      addToSelection: z.boolean().optional().default(false).describe("Add to existing selection"),
    },
    async (args) => selectActorsTool.handler(args)
  );
  toolCount++;

  // ========== BATCH TOOLS ==========
  const batchExecuteTool = createBatchExecuteTool(connectionManager);
  server.tool(
    batchExecuteTool.name,
    batchExecuteTool.description,
    {
      operations: z.array(z.object({
        type: z.enum(["call", "get", "set"]).describe("Operation type"),
        objectPath: z.string().describe("Path to the UObject"),
        target: z.string().describe("Function or property name"),
        value: z.unknown().optional().describe("Value for set/call operations"),
      })).min(1).max(100).describe("Operations to execute"),
    },
    async (args) => batchExecuteTool.handler(args)
  );
  toolCount++;

  // ========== ASSET TOOLS ==========
  const searchAssetsTool = createSearchAssetsTool(connectionManager);
  server.tool(
    searchAssetsTool.name,
    searchAssetsTool.description,
    {
      query: z.string().describe("Search query for asset name or path"),
      classFilter: z.string().optional().describe("Filter by asset class"),
      pathFilter: z.string().optional().describe("Filter by path prefix"),
      limit: z.number().optional().default(50).describe("Max results"),
    },
    async (args) => searchAssetsTool.handler(args)
  );
  toolCount++;

  const getAssetDataTool = createGetAssetDataTool(connectionManager);
  server.tool(
    getAssetDataTool.name,
    getAssetDataTool.description,
    {
      assetPath: z.string().describe("Full path to the asset"),
    },
    async (args) => getAssetDataTool.handler(args)
  );
  toolCount++;

  // ========== LEVEL TOOLS ==========
  const getCurrentLevelTool = createGetCurrentLevelTool(connectionManager);
  server.tool(
    getCurrentLevelTool.name,
    getCurrentLevelTool.description,
    {},
    async () => getCurrentLevelTool.handler({})
  );
  toolCount++;

  const openLevelTool = createOpenLevelTool(connectionManager);
  server.tool(
    openLevelTool.name,
    openLevelTool.description,
    {
      levelPath: z.string().describe("Path to the level to open"),
    },
    async (args) => openLevelTool.handler(args)
  );
  toolCount++;

  const saveLevelTool = createSaveLevelTool(connectionManager);
  server.tool(
    saveLevelTool.name,
    saveLevelTool.description,
    {},
    async () => saveLevelTool.handler({})
  );
  toolCount++;

  const saveAllTool = createSaveAllTool(connectionManager);
  server.tool(
    saveAllTool.name,
    saveAllTool.description,
    {},
    async () => saveAllTool.handler({})
  );
  toolCount++;

  // ========== EDITOR TOOLS ==========
  const playInEditorTool = createPlayInEditorTool(connectionManager);
  server.tool(
    playInEditorTool.name,
    playInEditorTool.description,
    {
      action: z.enum(["start", "stop", "pause", "resume"]).describe("PIE action"),
    },
    async (args) => playInEditorTool.handler(args)
  );
  toolCount++;

  const executeConsoleCommandTool = createExecuteConsoleCommandTool(connectionManager);
  server.tool(
    executeConsoleCommandTool.name,
    executeConsoleCommandTool.description,
    {
      command: z.string().describe("Console command to execute"),
    },
    async (args) => executeConsoleCommandTool.handler(args)
  );
  toolCount++;

  const focusViewportTool = createFocusViewportTool(connectionManager);
  server.tool(
    focusViewportTool.name,
    focusViewportTool.description,
    {
      actorPath: z.string().optional().describe("Actor to focus on"),
      location: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).optional().describe("Location to move camera to"),
    },
    async (args) => focusViewportTool.handler(args)
  );
  toolCount++;

  console.error(`[Tools] Registered ${toolCount} tools`);
}

// Re-export tool modules
export * from "./debug/index.js";
export * from "./object/index.js";
export * from "./actor/index.js";
export * from "./batch/index.js";
export * from "./asset/index.js";
export * from "./level/index.js";
export * from "./editor/index.js";
