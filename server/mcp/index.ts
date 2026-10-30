/**
 * Kresilo MCP server (stdio). Run from the repository root:
 *
 *   node_modules/.bin/jiti server/mcp/index.ts
 *
 * Standard output carries only the MCP protocol, so everything this process
 * wants to say to a person goes to standard error. See ./README.md.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KresiloClient } from "./client";
import { loadConfig } from "./config";
import { createKresiloServer } from "./server";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const server = createKresiloServer(new KresiloClient(config));
  await server.connect(new StdioServerTransport());
  // Never print the session itself, only whether one was given.
  console.error(
    `kresilo-mcp ready: app ${config.baseUrl}, actor "${config.actor}", ${
      config.session ? "session from KRESILO_SESSION" : "no session set (a guest workspace opens on first use)"
    }`,
  );
}

main().catch((error) => {
  console.error(`kresilo-mcp could not start: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
