import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverJs = join(root, "src", "server.js");

test("stdio server lists tools and round-trips save/get/search", async () => {
  const dir = mkdtempSync(join(tmpdir(), "item-store-smoke-"));
  const storeFile = join(dir, "store.json");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverJs],
    cwd: root,
    env: {
      ...process.env,
      ITEM_STORE_PATH: storeFile,
    },
  });
  const client = new Client({ name: "smoke", version: "0.0.0" });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name).sort();
    assert.deepEqual(names, ["get_item", "list_items", "save_item", "search_items"]);

    const saved = await client.callTool({
      name: "save_item",
      arguments: { title: "Keep", body: "after reopen", id: "p1", tags: ["ok"] },
    });
    const savedPayload = JSON.parse(saved.content[0].text);
    assert.equal(savedPayload.ok, true);
    assert.equal(savedPayload.item.id, "p1");

    const got = await client.callTool({ name: "get_item", arguments: { id: "p1" } });
    const gotPayload = JSON.parse(got.content[0].text);
    assert.equal(gotPayload.item.title, "Keep");
    assert.equal(gotPayload.item.body, "after reopen");

    const search = await client.callTool({ name: "search_items", arguments: { query: "reopen" } });
    const searchPayload = JSON.parse(search.content[0].text);
    assert.equal(searchPayload.count, 1);
    assert.equal(searchPayload.items[0].id, "p1");
  } finally {
    await client.close().catch(() => {});
    rmSync(dir, { recursive: true, force: true });
  }
});
