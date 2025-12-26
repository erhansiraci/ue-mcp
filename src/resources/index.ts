/**
 * MCP Resources for Unreal Engine
 *
 * Resources provide read-only access to Unreal Engine data.
 * They use URI templates to identify specific data sources.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConnectionManager } from "../client/index.js";

/**
 * Register all resources with the MCP server
 */
export function registerResources(
  server: McpServer,
  connectionManager: ConnectionManager
): void {
  let resourceCount = 0;

  // ========== STATIC RESOURCES ==========

  // API Schema resource
  server.resource(
    "unreal://api/schema",
    "unreal://api/schema",
    async (uri) => {
      if (connectionManager.isMockMode()) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  routes: [
                    { path: "/remote/object/call", method: "PUT" },
                    { path: "/remote/object/property", method: "PUT" },
                    { path: "/remote/object/describe", method: "PUT" },
                    { path: "/remote/batch", method: "PUT" },
                    { path: "/remote/preset", method: "GET" },
                    { path: "/remote/search/assets", method: "PUT" },
                  ],
                  mockMode: true,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const client = connectionManager.getHttpClient();
      const response = await client.getInfo();

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data ?? response, null, 2),
          },
        ],
      };
    }
  );
  resourceCount++;

  // Level actors resource
  server.resource(
    "unreal://level/actors",
    "unreal://level/actors",
    async (uri) => {
      if (connectionManager.isMockMode()) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  actors: [
                    {
                      name: "Floor",
                      path: "/Game/Maps/Level.Level:PersistentLevel.Floor",
                      class: "StaticMeshActor",
                    },
                    {
                      name: "PlayerStart",
                      path: "/Game/Maps/Level.Level:PersistentLevel.PlayerStart",
                      class: "PlayerStart",
                    },
                    {
                      name: "PointLight_1",
                      path: "/Game/Maps/Level.Level:PersistentLevel.PointLight_1",
                      class: "PointLight",
                    },
                  ],
                  count: 3,
                  mockMode: true,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const client = connectionManager.getHttpClient();
      const response = await client.callFunction(
        "/Script/UnrealEd.Default__EditorActorSubsystem",
        "GetAllLevelActors",
        {}
      );

      const actorPaths = (response.data as { ReturnValue?: string[] })
        ?.ReturnValue ?? [];

      const actors = actorPaths.map((path: string) => {
        const parts = path.split(".");
        const name = parts[parts.length - 1];
        return { name, path };
      });

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              { actors, count: actors.length },
              null,
              2
            ),
          },
        ],
      };
    }
  );
  resourceCount++;

  // Editor state resource
  server.resource(
    "unreal://editor/state",
    "unreal://editor/state",
    async (uri) => {
      if (connectionManager.isMockMode()) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  level: "/Game/Maps/Level",
                  selectedActors: [],
                  isPlaying: false,
                  isPaused: false,
                  mockMode: true,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const client = connectionManager.getHttpClient();

      // Get current level
      const levelResponse = await client.callFunction(
        "/Script/EditorScriptingUtilities.Default__EditorLevelLibrary",
        "GetEditorWorld",
        {}
      );
      const levelPath = (levelResponse.data as { ReturnValue?: string })
        ?.ReturnValue ?? "Unknown";

      // Get selected actors
      const selectedResponse = await client.callFunction(
        "/Script/UnrealEd.Default__EditorActorSubsystem",
        "GetSelectedLevelActors",
        {}
      );
      const selectedActors = (
        selectedResponse.data as { ReturnValue?: string[] }
      )?.ReturnValue ?? [];

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                level: levelPath,
                selectedActors,
                selectedCount: selectedActors.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
  resourceCount++;

  // Remote Control Presets list
  server.resource(
    "unreal://presets",
    "unreal://presets",
    async (uri) => {
      if (connectionManager.isMockMode()) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  presets: [
                    { name: "LightingPreset", path: "/Game/Presets/LightingPreset" },
                    { name: "CameraPreset", path: "/Game/Presets/CameraPreset" },
                  ],
                  count: 2,
                  mockMode: true,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const client = connectionManager.getHttpClient();
      const response = await client.getPresets();

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data ?? response, null, 2),
          },
        ],
      };
    }
  );
  resourceCount++;

  // Note: Dynamic resource templates (unreal://preset/{name}, unreal://object/{path}/description)
  // are not directly supported by the MCP SDK. Use the corresponding tools instead:
  // - ue_describe_object for object metadata
  // - Preset tools for preset operations

  console.error(`[Resources] Registered ${resourceCount} resources`);
}
