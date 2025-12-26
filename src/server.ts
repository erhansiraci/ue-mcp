/**
 * MCP Server setup for Unreal Engine
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, logConfig, Config } from "./config/index.js";
import { ConnectionManager } from "./client/index.js";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

/**
 * Server instance with connection manager
 */
export interface ServerInstance {
  server: McpServer;
  connectionManager: ConnectionManager;
  config: Config;
}

/**
 * Create the MCP server instance
 */
export async function createServer(): Promise<ServerInstance> {
  const config = loadConfig();

  // Create MCP server
  const server = new McpServer({
    name: "unreal-engine-mcp",
    version: "1.0.0",
  });

  // Initialize connection manager
  const connectionManager = new ConnectionManager(config);

  // Register all tools, resources, and prompts
  registerTools(server, connectionManager);
  registerResources(server, connectionManager);
  registerPrompts(server);

  return { server, connectionManager, config };
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(): Promise<void> {
  const { server, connectionManager, config } = await createServer();

  // Log configuration
  if (config.verbose) {
    logConfig(config);
  } else {
    console.error("Unreal Engine MCP Server starting...");
    console.error(`  HTTP: ${config.httpUrl}`);
    console.error(`  Mock Mode: ${config.mockMode}`);
  }

  // Attempt initial connection (non-blocking)
  try {
    await connectionManager.connect();
  } catch (err) {
    console.error(`[Server] Initial connection failed: ${err instanceof Error ? err.message : err}`);
    console.error("[Server] Server will retry on each request.");
  }

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[Server] MCP server connected to transport");
}
