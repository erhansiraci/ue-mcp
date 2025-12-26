# Unreal Engine MCP Server

A comprehensive Model Context Protocol (MCP) server that enables Claude and other AI assistants to interact with Unreal Engine through the Remote Control API.

## Features

- **22 MCP Tools** - Full control over actors, assets, levels, and editor
- **4 MCP Resources** - Read-only data access to engine state
- **6 MCP Prompts** - Workflow templates for common tasks
- **Remote Control API Integration** - HTTP-based communication
- **Mock Mode** - Test without running Unreal Engine
- **TypeScript** - Full type safety with Zod validation
- **Batch Operations** - Execute multiple operations efficiently

## Requirements

- Node.js 18+
- Unreal Engine 5.x with Remote Control API plugin enabled

### Enabling Remote Control in Unreal Engine

1. Open your project in Unreal Editor
2. Go to **Edit > Plugins**
3. Search for "Remote Control API" in the Messaging category
4. Enable the plugin and restart the editor

The Remote Control API server starts automatically on port 30010.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/ue-mcp.git
cd ue-mcp

# Install dependencies
npm install

# Build
npm run build
```

## Usage

### Start the server

```bash
# Default settings (connects to localhost:30010)
npm start

# Mock mode (for testing without Unreal Engine)
npm run start:mock

# Custom host/port
node dist/index.js --host 192.168.1.100 --http-port 30010

# Development mode with hot reload
npm run dev
```

### CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--host` | `-h` | Unreal Engine host address | `127.0.0.1` |
| `--http-port` | `-p` | Remote Control HTTP port | `30010` |
| `--ws-port` | `-w` | Remote Control WebSocket port | `30020` |
| `--timeout` | `-t` | Request timeout (ms) | `5000` |
| `--mock` | `-m` | Enable mock mode | `false` |
| `--verbose` | `-v` | Enable verbose logging | `false` |

## Claude Desktop Configuration

Add to your Claude Desktop configuration (`~/.claude.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "unreal-engine": {
      "command": "node",
      "args": ["/path/to/ue-mcp/dist/index.js"],
      "env": {
        "UE_HOST": "127.0.0.1",
        "UE_HTTP_PORT": "30010"
      }
    }
  }
}
```

## Available Tools (22)

### Debug Tools
| Tool | Description |
|------|-------------|
| `ue_ping` | Test connection to Unreal Engine |
| `ue_get_api_info` | Get available API routes |

### Object Tools
| Tool | Description |
|------|-------------|
| `ue_call_function` | Call Blueprint-callable functions on UObjects |
| `ue_get_property` | Read property values from objects |
| `ue_set_property` | Write property values to objects |
| `ue_describe_object` | Get object metadata (properties, functions) |

### Actor Tools
| Tool | Description |
|------|-------------|
| `ue_get_all_actors` | List all actors in the current level |
| `ue_get_selected_actors` | Get currently selected actors |
| `ue_spawn_actor` | Spawn a new actor in the level |
| `ue_destroy_actor` | Delete an actor from the level |
| `ue_transform_actor` | Move, rotate, or scale an actor |
| `ue_select_actors` | Set editor selection |

### Batch Tools
| Tool | Description |
|------|-------------|
| `ue_batch_execute` | Execute multiple operations in one request |

### Asset Tools
| Tool | Description |
|------|-------------|
| `ue_search_assets` | Search the asset registry |
| `ue_get_asset_data` | Get asset metadata |

### Level Tools
| Tool | Description |
|------|-------------|
| `ue_get_current_level` | Get current level information |
| `ue_open_level` | Open a level |
| `ue_save_level` | Save the current level |
| `ue_save_all` | Save all modified assets |

### Editor Tools
| Tool | Description |
|------|-------------|
| `ue_play_in_editor` | Control PIE (start/stop/pause/resume) |
| `ue_execute_console_command` | Run console commands |
| `ue_focus_viewport` | Move viewport to actor or location |

## Available Resources (4)

Resources provide read-only access to Unreal Engine data via URI patterns.

| Resource URI | Description |
|--------------|-------------|
| `unreal://api/schema` | Available Remote Control API endpoints |
| `unreal://level/actors` | All actors in the current level |
| `unreal://editor/state` | Current editor state (level, selection) |
| `unreal://presets` | List of Remote Control Presets |

## Available Prompts (6)

Prompts are workflow templates that guide common tasks.

| Prompt | Description |
|--------|-------------|
| `spawn-actors-grid` | Create a grid of actors at specified positions |
| `batch-property-edit` | Edit a property on multiple actors at once |
| `debug-actor` | Get comprehensive debug info about an actor |
| `setup-level` | Set up a new level with common elements |
| `explore-blueprint` | Explore a Blueprint's properties and functions |
| `use-preset` | Work with a Remote Control Preset |

## Example Interactions

```
You: Ping Unreal Engine to check if it's connected
Claude: [Uses ue_ping tool]
Successfully connected to Unreal Engine at http://127.0.0.1:30010

You: List all the lights in the level
Claude: [Uses ue_get_all_actors with classFilter="PointLight"]
Found 3 actors: PointLight_1, PointLight_2, SpotLight_1

You: Spawn a point light at position (500, 0, 200)
Claude: [Uses ue_spawn_actor tool]
Successfully spawned PointLight at (500, 0, 200)

You: Move it up by 100 units
Claude: [Uses ue_transform_actor tool]
Successfully set location on actor

You: Save the level
Claude: [Uses ue_save_level tool]
Level saved successfully
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Build
npm run build

# Run tests
npm test

# Test with MCP Inspector
npm run inspector
```

## Architecture

```
src/
├── index.ts              # CLI entry point
├── server.ts             # MCP server setup
├── config/               # Configuration system
├── client/               # HTTP client for Remote Control API
├── tools/
│   ├── debug/            # ue_ping, ue_get_api_info
│   ├── object/           # ue_call_function, ue_get_property, etc.
│   ├── actor/            # ue_spawn_actor, ue_transform_actor, etc.
│   ├── asset/            # ue_search_assets, ue_get_asset_data
│   ├── level/            # ue_open_level, ue_save_level, etc.
│   ├── editor/           # ue_play_in_editor, ue_execute_console_command
│   └── batch/            # ue_batch_execute
├── resources/            # MCP resources (read-only data)
├── prompts/              # MCP prompts (workflow templates)
└── utils/                # Error handling utilities
```

## Environment Variables

```bash
UE_HOST=127.0.0.1        # Unreal Engine host
UE_HTTP_PORT=30010       # Remote Control HTTP port
UE_WS_PORT=30020         # Remote Control WebSocket port
UE_TIMEOUT=5000          # Request timeout (ms)
UE_MOCK_MODE=false       # Enable mock mode
UE_VERBOSE=false         # Enable verbose logging
```

## License

MIT

## Sources

- [Unreal Engine Remote Control API](https://dev.epicgames.com/documentation/en-us/unreal-engine/remote-control-api-http-reference-for-unreal-engine)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
