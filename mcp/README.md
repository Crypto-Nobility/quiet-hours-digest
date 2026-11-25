# Item Store MCP server

A local JSON item store exposed as a stdio MCP server. Agents can save, get, list, and search items on disk. No network port and no API keys.

<!-- mcp-name: io.github.Crypto-Nobility/item-store -->

## Install

```bash
npm install -g @Crypto-Nobility/item-store
```

Or run without a global install:

```bash
npx -y @Crypto-Nobility/item-store
```

Node.js 18 or later is required.

## Configure a client

Example `mcp.json` / Claude Desktop entry:

```json
{
  "mcpServers": {
    "item-store": {
      "command": "npx",
      "args": ["-y", "@Crypto-Nobility/item-store"],
      "env": {
        "ITEM_STORE_PATH": "/absolute/path/to/store.json"
      }
    }
  }
}
```

`ITEM_STORE_PATH` is optional. When it is omitted, the server writes `data/store.json` under the process working directory.

## Tools

- `save_item` — create an item, or update it when the same `id` is provided. `created_at` is kept on update.
- `get_item` — read one item by `id`.
- `list_items` — list stored items (`id`, `title`, `tags`, `updated_at`).
- `search_items` — find items whose id, title, body, or tags contain the query.

## Development

```bash
npm test
npm start
```

## License

MIT. Questions and issue reports go to the issue tracker of this repository. There is no other contact channel.
