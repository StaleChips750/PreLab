# Render MCP setup

This repo ships a project-level [`.mcp.json`](../.mcp.json) that wires the
[Render MCP server](https://render.com/docs/mcp-server) into Claude Code so you can
manage Render resources (services, databases, metrics, logs) with natural-language
prompts.

## How the key is handled

The config references the API key via **environment-variable expansion** — the secret
is **never** stored in the repo:

```json
{
  "mcpServers": {
    "render": {
      "type": "http",
      "url": "https://mcp.render.com/mcp",
      "headers": { "Authorization": "Bearer ${RENDER_API_KEY}" }
    }
  }
}
```

At startup Claude Code substitutes `${RENDER_API_KEY}` with the value from your
environment. If the variable is unset, calls to the Render API fail with a `400`.

## One-time setup

1. **Create a Render API key** — Render dashboard → **Account Settings → API Keys**.
   Note: Render API keys are *broadly scoped* (full access to every workspace and
   service on the account), so treat the value like a password.

2. **Expose it as `RENDER_API_KEY`** — never paste it into chat, code, or this repo.

   - **Claude Code on the web:** add `RENDER_API_KEY` as an environment **secret** in
     the environment's settings.
   - **Local Claude Code:** export it in your shell profile, e.g.
     ```bash
     export RENDER_API_KEY="rnd_xxxxxxxxxxxxxxxxxxxx"
     ```

3. **Restart / reload** the Claude Code session so the MCP server picks up the value.

## Verify the connection

```bash
# Lists the workspaces (owners) the key can access — expect HTTP 200.
curl -sS -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/owners
```

Inside Claude Code, the `mcp__Render__*` tools should then respond. Select the target
workspace with `select_workspace` (owner ID looks like `tea-…` or `usr-…`) before
running any other calls — acting on the wrong workspace can be destructive.

## Rotating the key

If a key is ever exposed (committed, pasted into chat, logged), rotate it immediately:
Render dashboard → **Account Settings → API Keys** → delete the old key and create a
new one, then update `RENDER_API_KEY` wherever it's stored.
