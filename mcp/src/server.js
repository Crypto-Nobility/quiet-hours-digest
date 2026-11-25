#!/usr/bin/env node
/**
 * stdio MCP server for a local JSON item store. No network port, no API keys.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ItemStore, StoreError } from "./store.js";

const server = new McpServer({
  name: "item-store",
  version: "1.0.0",
});

function store() {
  return new ItemStore();
}

function ok(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

function fail(message) {
  return ok({ ok: false, error: message });
}

server.registerTool(
  "save_item",
  {
    title: "Save item",
    description: "Create an item or update it when the same id is provided. created_at is kept on update.",
    inputSchema: {
      title: z.string().describe("Item title"),
      body: z.string().optional().describe("Item body"),
      id: z.string().optional().describe("Item id. Generated when omitted. Same id updates the item."),
      tags: z.array(z.string()).optional().describe("Optional tags"),
    },
  },
  async ({ title, body, id, tags }) => {
    try {
      const item = store().saveItem({ title, body: body || "", id: id || null, tags: tags || [] });
      return ok({ ok: true, item, updated: Boolean(id) });
    } catch (err) {
      if (err instanceof StoreError) return fail(err.message);
      throw err;
    }
  },
);

server.registerTool(
  "get_item",
  {
    title: "Get item",
    description: "Read one item by id.",
    inputSchema: {
      id: z.string().describe("Item id"),
    },
  },
  async ({ id }) => {
    try {
      return ok({ ok: true, item: store().getItem(id) });
    } catch (err) {
      if (err instanceof StoreError) return fail(err.message);
      throw err;
    }
  },
);

server.registerTool(
  "list_items",
  {
    title: "List items",
    description: "Return a list of stored items (id, title, tags, updated_at).",
    inputSchema: {},
  },
  async () => {
    const items = store().listItems();
    return ok({ ok: true, count: items.length, items });
  },
);

server.registerTool(
  "search_items",
  {
    title: "Search items",
    description: "Find items whose id, title, body, or tags contain the query.",
    inputSchema: {
      query: z.string().describe("Search query"),
    },
  },
  async ({ query }) => {
    const items = store().searchItems(query);
    return ok({ ok: true, count: items.length, items });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
