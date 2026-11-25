/**
 * Local JSON item store. No network, no secrets.
 * Behaviour matches the original local prototype: save, get, list, search,
 * and created_at is kept when the same id is updated.
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export class StoreError extends Error {
  constructor(message) {
    super(message);
    this.name = "StoreError";
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function defaultStorePath() {
  const raw = process.env.ITEM_STORE_PATH;
  if (raw && String(raw).trim()) {
    return resolve(String(raw).trim());
  }
  return resolve(process.cwd(), "data", "store.json");
}

export class ItemStore {
  constructor(path = defaultStorePath()) {
    this.path = path;
  }

  empty() {
    return { version: 1, items: {} };
  }

  load() {
    if (!existsSync(this.path)) {
      return this.empty();
    }
    const raw = readFileSync(this.path, "utf8");
    if (!raw.trim()) {
      return this.empty();
    }
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("items" in data) || typeof data.items !== "object") {
      throw new StoreError("store.json is not in the expected format.");
    }
    return data;
  }

  write(data) {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    renameSync(tmp, this.path);
  }

  saveItem({ title, body = "", id = null, tags = null }) {
    title = String(title || "").trim();
    if (!title) {
      throw new StoreError("title cannot be empty.");
    }
    const data = this.load();
    const items = data.items;
    const cleanTags = (Array.isArray(tags) ? tags : []).map((t) => String(t).trim()).filter(Boolean);
    const stamp = nowIso();
    let itemId = id ? String(id).trim() : "";
    let item;
    if (itemId && items[itemId]) {
      const prev = items[itemId];
      item = {
        id: itemId,
        title,
        body,
        tags: cleanTags,
        created_at: prev.created_at || stamp,
        updated_at: stamp,
      };
    } else {
      if (!itemId) {
        itemId = randomBytes(6).toString("hex");
      }
      if (items[itemId]) {
        throw new StoreError(`id already exists: ${itemId}`);
      }
      item = {
        id: itemId,
        title,
        body,
        tags: cleanTags,
        created_at: stamp,
        updated_at: stamp,
      };
    }
    items[itemId] = item;
    data.items = items;
    this.write(data);
    return item;
  }

  getItem(itemId) {
    itemId = String(itemId || "").trim();
    if (!itemId) {
      throw new StoreError("id is required.");
    }
    const items = this.load().items;
    if (!(itemId in items)) {
      throw new StoreError(`item not found: ${itemId}`);
    }
    return items[itemId];
  }

  listItems() {
    const items = this.load().items;
    const rows = Object.values(items).map((item) => ({
      id: item.id,
      title: item.title || "",
      tags: item.tags || [],
      updated_at: item.updated_at,
    }));
    rows.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
    return rows;
  }

  searchItems(query) {
    query = String(query || "").trim();
    if (!query) {
      return [];
    }
    const needle = query.toLowerCase();
    const hits = [];
    for (const item of Object.values(this.load().items)) {
      const blob = [item.id, item.title, item.body, ...(item.tags || [])].join(" ").toLowerCase();
      const parts = needle.split(/\s+/).filter(Boolean);
      if (blob.includes(needle) || (parts.length && parts.every((p) => blob.includes(p)))) {
        hits.push(item);
      }
    }
    hits.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
    return hits;
  }
}
