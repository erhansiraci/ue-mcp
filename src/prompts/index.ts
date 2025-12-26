/**
 * MCP Prompts for Unreal Engine
 *
 * Prompts provide pre-configured workflows and interaction templates
 * that help users perform common tasks efficiently.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register all prompts with the MCP server
 */
export function registerPrompts(server: McpServer): void {
  let promptCount = 0;

  // ========== SPAWN ACTORS GRID ==========
  server.prompt(
    "spawn-actors-grid",
    "Create a grid of actors at specified positions",
    {
      className: z.string().describe("Class name of actor to spawn (e.g., PointLight, StaticMeshActor)"),
      gridSizeX: z.string().describe("Number of actors in X direction (default: 3)"),
      gridSizeY: z.string().describe("Number of actors in Y direction (default: 3)"),
      spacing: z.string().describe("Distance between actors (default: 200)"),
      startX: z.string().describe("Starting X coordinate (default: 0)"),
      startY: z.string().describe("Starting Y coordinate (default: 0)"),
      startZ: z.string().describe("Z coordinate for all actors (default: 100)"),
    },
    async (args) => {
      const className = args.className ?? "PointLight";
      const gridX = parseInt(args.gridSizeX ?? "3", 10);
      const gridY = parseInt(args.gridSizeY ?? "3", 10);
      const spacing = parseInt(args.spacing ?? "200", 10);
      const startX = parseInt(args.startX ?? "0", 10);
      const startY = parseInt(args.startY ?? "0", 10);
      const startZ = parseInt(args.startZ ?? "100", 10);

      const totalActors = gridX * gridY;
      const positions: string[] = [];

      for (let x = 0; x < gridX; x++) {
        for (let y = 0; y < gridY; y++) {
          const posX = startX + x * spacing;
          const posY = startY + y * spacing;
          positions.push(`(${posX}, ${posY}, ${startZ})`);
        }
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a ${gridX}x${gridY} grid of ${className} actors with ${spacing} unit spacing.

The grid should start at position (${startX}, ${startY}, ${startZ}).

Total actors to spawn: ${totalActors}

Positions:
${positions.join("\n")}

Use the ue_spawn_actor tool to create each actor. You can use ue_batch_execute for efficiency if spawning many actors.`,
            },
          },
        ],
      };
    }
  );
  promptCount++;

  // ========== BATCH PROPERTY EDIT ==========
  server.prompt(
    "batch-property-edit",
    "Edit a property on multiple actors at once",
    {
      actorClass: z.string().describe("Class of actors to modify (e.g., PointLight)"),
      propertyName: z.string().describe("Property to modify (e.g., Intensity)"),
      propertyValue: z.string().describe("New value for the property"),
    },
    async (args) => {
      const actorClass = args.actorClass ?? "PointLight";
      const propertyName = args.propertyName ?? "Intensity";
      const propertyValue = args.propertyValue ?? "5000";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Modify the "${propertyName}" property of all ${actorClass} actors in the level.

Steps:
1. Use ue_get_all_actors with classFilter="${actorClass}" to get all matching actors
2. For each actor found, use ue_set_property to set "${propertyName}" to ${propertyValue}
3. Alternatively, use ue_batch_execute for better performance with multiple actors

Expected result: All ${actorClass} actors should have ${propertyName} = ${propertyValue}`,
            },
          },
        ],
      };
    }
  );
  promptCount++;

  // ========== DEBUG ACTOR ==========
  server.prompt(
    "debug-actor",
    "Get comprehensive debug information about an actor",
    {
      actorPath: z.string().describe("Full path to the actor (or use 'selected' to debug selected actor)"),
    },
    async (args) => {
      const actorPath = args.actorPath ?? "selected";
      const isSelected = actorPath.toLowerCase() === "selected";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: isSelected
                ? `Debug the currently selected actor(s).

Steps:
1. Use ue_get_selected_actors to get the selected actor path(s)
2. For each selected actor, use ue_describe_object to get full metadata
3. Use ue_get_property to read key properties like:
   - RelativeLocation (from RootComponent)
   - RelativeRotation (from RootComponent)
   - RelativeScale3D (from RootComponent)
   - ActorLabel
4. Report all gathered information in a structured format

Include class name, available functions, exposed properties, and current transform.`
                : `Debug the actor at path: ${actorPath}

Steps:
1. Use ue_describe_object with objectPath="${actorPath}" to get full metadata
2. Use ue_get_property to read key properties like:
   - RelativeLocation (from RootComponent)
   - RelativeRotation (from RootComponent)
   - RelativeScale3D (from RootComponent)
   - ActorLabel
3. Report all gathered information in a structured format

Include class name, available functions, exposed properties, and current transform.`,
            },
          },
        ],
      };
    }
  );
  promptCount++;

  // ========== SETUP LEVEL ==========
  server.prompt(
    "setup-level",
    "Set up a new level with common elements",
    {
      levelType: z.string().describe("Type of level: 'empty', 'basic', or 'lit' (default: basic)"),
      floorSize: z.string().describe("Size of the floor in units (default: 2000)"),
    },
    async (args) => {
      const levelType = args.levelType ?? "basic";
      const floorSize = parseInt(args.floorSize ?? "2000", 10);

      let setupInstructions = "";

      if (levelType === "empty") {
        setupInstructions = "Create a minimal empty level with just a PlayerStart.";
      } else if (levelType === "lit") {
        setupInstructions = `Create a fully lit level with:
- Floor plane (${floorSize}x${floorSize} units)
- PlayerStart at center
- DirectionalLight for main illumination
- SkyLight for ambient
- 4 PointLights at corners
- ExponentialHeightFog for atmosphere`;
      } else {
        setupInstructions = `Create a basic level with:
- Floor plane (${floorSize}x${floorSize} units)
- PlayerStart at center (0, 0, 100)
- One PointLight above center (0, 0, 500)`;
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Set up a new "${levelType}" level.

${setupInstructions}

Use ue_spawn_actor for each element. Common class names:
- Floor: /Script/Engine.StaticMeshActor (set mesh to /Engine/BasicShapes/Plane)
- PlayerStart: /Script/Engine.PlayerStart
- PointLight: /Script/Engine.PointLight
- DirectionalLight: /Script/Engine.DirectionalLight
- SkyLight: /Script/Engine.SkyLight
- Fog: /Script/Engine.ExponentialHeightFog

After spawning, configure properties as needed (intensity, color, etc.).`,
            },
          },
        ],
      };
    }
  );
  promptCount++;

  // ========== EXPLORE BLUEPRINT ==========
  server.prompt(
    "explore-blueprint",
    "Explore a Blueprint's properties and functions",
    {
      blueprintPath: z.string().describe("Path to the Blueprint asset (e.g., /Game/Blueprints/BP_MyActor)"),
    },
    async (args) => {
      const bpPath = args.blueprintPath ?? "/Game/Blueprints/BP_Example";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Explore the Blueprint at: ${bpPath}

Steps:
1. Use ue_describe_object with the Blueprint's CDO path:
   "${bpPath}.Default__${bpPath.split("/").pop()}_C"

2. Examine the returned metadata:
   - List all exposed properties with their types
   - List all Blueprint-callable functions
   - Identify any components

3. If the Blueprint is placed in a level, use ue_search_assets or ue_get_all_actors to find instances

4. Summarize:
   - What this Blueprint represents
   - Key configurable properties
   - Available functions that can be called
   - How to interact with instances of this Blueprint`,
            },
          },
        ],
      };
    }
  );
  promptCount++;

  // ========== USE PRESET ==========
  server.prompt(
    "use-preset",
    "Work with a Remote Control Preset",
    {
      presetName: z.string().describe("Name of the Remote Control Preset to use"),
      action: z.string().describe("Action: 'list', 'get', 'set', or 'call' (default: list)"),
    },
    async (args) => {
      const presetName = args.presetName ?? "";
      const action = args.action ?? "list";

      if (!presetName || action === "list") {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `List all available Remote Control Presets.

Use the unreal://presets resource to get the list of presets, then describe what each preset contains.

For each preset, you can:
- Read exposed properties
- Call exposed functions
- Get/set metadata

Remote Control Presets are configured in Unreal Editor under Window > Remote Control.`,
              },
            },
          ],
        };
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Work with Remote Control Preset: "${presetName}"

Action: ${action}

${action === "get" ? `Use the unreal://preset/${presetName} resource to get all exposed properties and functions.` : ""}
${action === "set" ? `Get the preset details first, then use ue_set_property on the exposed properties you want to modify.` : ""}
${action === "call" ? `Get the preset details to see available functions, then use ue_call_function to execute them.` : ""}

Presets expose UObject properties and functions for remote control without needing to know internal paths.`,
            },
          },
        ],
      };
    }
  );
  promptCount++;

  console.error(`[Prompts] Registered ${promptCount} prompts`);
}
