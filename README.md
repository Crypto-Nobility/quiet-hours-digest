# Quiet Hours Digest — workflow templates and a local item store

MIT-licensed templates and a small MCP server. Import or run them yourself. This repository does not collect accounts, payments, or personal data.

Questions and bug reports belong in the issue tracker of this repository. There is no other contact channel.

## Contents

- `n8n/quiet-hours-digest.json` — n8n workflow: hold non-critical alerts during quiet hours, then send one digest. Critical alerts go out immediately.
- `n8n/escalate-unacknowledged-alerts.json` — n8n workflow: if a critical alert is not acknowledged in time, escalate once to a backup webhook.
- `make/blueprint.json` — Make.com scenario blueprint for the quiet-hours digest (webhook side).
- `make/flush_blueprint.json` — Make.com scenario blueprint that flushes held alerts after quiet hours. Import this as a second scenario and point it at the same Data Store and alert URL. Make allows one trigger per scenario.
- `mcp/` — a local JSON item-store MCP server (npm package source). See `mcp/README.md`.

## n8n

In n8n: Menu → Import from File, choose a JSON file in `n8n/`. Replace the `https://example.invalid/...` placeholder with your HTTPS alert URL before you activate the workflow. Add header authentication on the inbound webhook; it is unauthenticated until you do.

## Make

In Make: open a new scenario (or a new template), then the three-dot menu → Import blueprint, and choose `make/blueprint.json`. Create a Custom webhook and a Data Store, attach them, and replace the alert URL placeholder. Import `make/flush_blueprint.json` into a separate scenario, attach the same Data Store, copy the same settings, and turn both on. After import, confirm module output field names (for example HTTP `statusCode` and Data Store `exists`) match the filters.

Data Store fields used by the blueprints: `kind` (text), `fingerprint` (text), `received_at` (text), `severity` (text), `source` (text), `title` (text), `message` (text), `alert_id` (text), `ts` (number).

## MCP server

```bash
cd mcp
npm install
npm test
npx item-store-mcp
```

## License

MIT. See `LICENSE`.
