#!/usr/bin/env node
/**
 * Unreal Engine MCP Server
 *
 * Entry point for the MCP server that provides Claude integration
 * with Unreal Engine via the Remote Control API.
 */
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { startServer } from "./server.js";

/**
 * Parse command line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .scriptName("ue-mcp")
    .usage("$0 [options]")
    .option("host", {
      alias: "h",
      type: "string",
      description: "Unreal Engine host address",
    })
    .option("http-port", {
      alias: "p",
      type: "number",
      description: "Remote Control HTTP port",
    })
    .option("ws-port", {
      alias: "w",
      type: "number",
      description: "Remote Control WebSocket port",
    })
    .option("timeout", {
      alias: "t",
      type: "number",
      description: "Request timeout in milliseconds",
    })
    .option("mock", {
      alias: "m",
      type: "boolean",
      description: "Run in mock mode (no UE connection required)",
    })
    .option("verbose", {
      alias: "v",
      type: "boolean",
      description: "Enable verbose logging",
    })
    .example("$0", "Start server with default settings")
    .example("$0 --mock", "Start in mock mode for testing")
    .example("$0 --host 192.168.1.100 --http-port 30010", "Connect to remote UE instance")
    .help()
    .parseSync();
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = parseArgs();

  // Set environment variables from CLI args (they take precedence)
  if (args.host) process.env.UE_HOST = args.host;
  if (args["http-port"]) process.env.UE_HTTP_PORT = args["http-port"].toString();
  if (args["ws-port"]) process.env.UE_WS_PORT = args["ws-port"].toString();
  if (args.timeout) process.env.UE_TIMEOUT = args.timeout.toString();
  if (args.mock) process.env.UE_MOCK_MODE = "true";
  if (args.verbose) process.env.UE_VERBOSE = "true";

  // Start the server
  await startServer();
}

// Run main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
