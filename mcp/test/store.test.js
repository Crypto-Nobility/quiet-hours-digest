import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ItemStore, StoreError } from "../src/store.js";

function withStore(fn) {
  const dir = mkdtempSync(join(tmpdir(), "item-store-"));
  const path = join(dir, "store.json");
  const store = new ItemStore(path);
  return Promise.resolve()
    .then(() => fn(store, path))
    .finally(() => rmSync(dir, { recursive: true, force: true }));
}

test("write and read", async () => {
  await withStore((store) => {
    const saved = store.saveItem({
      title: "Format rule",
      body: "Lead with the conclusion",
      id: "a1",
      tags: ["report"],
    });
    assert.equal(saved.id, "a1");
    const got = store.getItem("a1");
    assert.equal(got.title, "Format rule");
    assert.equal(got.body, "Lead with the conclusion");
    assert.deepEqual(got.tags, ["report"]);
  });
});

test("update keeps created_at", async () => {
  await withStore((store) => {
    const first = store.saveItem({ title: "Draft", body: "v1", id: "u1" });
    const updated = store.saveItem({ title: "Edited", body: "v2", id: "u1", tags: ["updated"] });
    assert.equal(updated.id, "u1");
    assert.equal(updated.title, "Edited");
    assert.equal(updated.body, "v2");
    assert.equal(updated.created_at, first.created_at);
    assert.ok(updated.updated_at >= first.updated_at);
  });
});

test("list and search", async () => {
  await withStore((store) => {
    store.saveItem({ title: "Report format", body: "Lead with the conclusion", id: "s1", tags: ["format"] });
    store.saveItem({ title: "Cost saving", body: "no signup", id: "s2", tags: ["ops"] });
    const listed = store.listItems();
    assert.deepEqual(new Set(listed.map((r) => r.id)), new Set(["s1", "s2"]));
    assert.deepEqual(store.searchItems("conclusion").map((h) => h.id), ["s1"]);
    assert.deepEqual(store.searchItems("ops").map((h) => h.id), ["s2"]);
  });
});

test("persists after reload", async () => {
  await withStore((store, path) => {
    store.saveItem({ title: "Keep", body: "after reopen", id: "p1" });
    const reopened = new ItemStore(path);
    const got = reopened.getItem("p1");
    assert.equal(got.title, "Keep");
    assert.equal(got.body, "after reopen");
  });
});

test("missing item", async () => {
  await withStore((store) => {
    assert.throws(() => store.getItem("no-such"), StoreError);
  });
});

test("empty title rejected", async () => {
  await withStore((store) => {
    assert.throws(() => store.saveItem({ title: "  " }), StoreError);
  });
});
