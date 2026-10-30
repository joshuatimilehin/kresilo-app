/**
 * The MCP server itself: tools/list and tools/call over whatever transport the
 * caller connects (stdio in production, an in-memory pair in tests).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { CommandClient } from "./client";
import { buildTools, callTool, type ToolSpec } from "./tools";

export const SERVER_NAME = "kresilo";
export const SERVER_VERSION = "0.1.0";

export const INSTRUCTIONS = [
  "Kresilo is a studio for making a poster from references, with reasons. You are connected to a person's workspace through the same commands their screen uses, and every change you make is recorded in project history under your actor name.",
  "Start with list_projects (then get_project for detail), or create_project for something new. Save references with add_reference and say why each one matters, because a proposal is grounded in those reasons: request_proposal needs at least one.",
  "request_proposal changes nothing by itself (unless the project applies AI changes right away). accept_proposal applies it and records the decision; decline_proposal keeps the artwork. For direct edits use edit_layer or edit_artwork. undo and redo step through versions.",
  "Results are compact JSON with the project revision. You may pass that revision back, or leave it out to use the latest. Use your judgement: act directly when the person asked for the change, and say plainly what you changed.",
].join("\n");

export function createKresiloServer(
  client: CommandClient,
  tools: ToolSpec[] = buildTools(),
): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema as { type: "object" },
      annotations: {
        title: tool.title,
        readOnlyHint: tool.readOnly,
        destructiveHint: false,
        openWorldHint: false,
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    callTool(tools, request.params.name, request.params.arguments, { client }),
  );

  return server;
}
