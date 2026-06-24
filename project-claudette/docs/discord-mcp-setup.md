# Discord MCP — Setup Guide

Configuration notes for wiring up a **Discord MCP server** so an MCP client
(Claude Desktop, Claude Code, or a custom SDK host) can **read and send
Discord messages** as tools.

> **Scope:** this document is *config only*. It gets a Discord bot + the
> `discordmcp` MCP server running and connected to an MCP client. The
> **Project Claudette** integration (routing Discord DMs through Claudette's
> memory + LLM pipeline, the way Instagram DMs are today) is a **later step** —
> see [§7 Where Claudette plugs in](#7-where-claudette-plugs-in). Don't build
> that part yet.

---

## 1. What this is

[`discordmcp`](https://github.com/v-3/discordmcp) is a small TypeScript
[Model Context Protocol](https://modelcontextprotocol.io) server. Once
connected, it exposes two tools to the MCP client:

| Tool | What it does | Inputs |
|---|---|---|
| `send-message` | Sends a message to a text channel | `server` (optional if the bot is in one guild), `channel` (name or ID), `message` |
| `read-messages` | Reads recent messages from a channel | `server` (optional), `channel`, `limit` (default `50`, max `100`) |

The MCP client (e.g. Claude) decides when to call them; the server just brokers
the Discord API calls using a bot token you supply.

---

## 2. Prerequisites

- **Node.js 16+** (18+ recommended) and npm.
- A **Discord account** with permission to add a bot to the target server.
- The target **Discord server (guild)** you want the bot to read/post in.

---

## 3. Create the Discord bot

1. Open the **[Discord Developer Portal](https://discord.com/developers/applications)** → **New Application**. Name it (e.g. `claudette-discord`).
2. Left sidebar → **Bot** → **Add Bot**.
3. Under **Privileged Gateway Intents**, enable **MESSAGE CONTENT INTENT**.
   Without this, `read-messages` returns empty content.
4. Click **Reset Token** → **Copy**. This is your `DISCORD_TOKEN`.
   **Treat it like a password** — anyone with it controls the bot. Never commit it.

### Invite the bot to your server

1. Left sidebar → **OAuth2** → **URL Generator**.
2. **Scopes:** check `bot`.
3. **Bot Permissions:** check at minimum
   - `View Channels`
   - `Send Messages`
   - `Read Message History`
4. Copy the generated URL, open it in a browser, pick your server, **Authorize**.
5. In Discord, make sure the bot's role can actually see the channels you care
   about (channel-level permission overrides can hide channels even when the
   role looks correct).

---

## 4. Install & build the server

```bash
git clone https://github.com/v-3/discordmcp.git
cd discordmcp
npm install
npm run build      # compiles TypeScript → build/index.js
```

Provide the token via environment. The server reads `DISCORD_TOKEN`:

```bash
# discordmcp/.env  (already gitignored by that repo)
DISCORD_TOKEN=your_discord_bot_token
```

> The MCP client can also pass `DISCORD_TOKEN` in its server config (see §5),
> which avoids a separate `.env` file. Pick **one** source of truth.

---

## 5. Connect it to an MCP client

### Claude Desktop

Edit `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```jsonc
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["/absolute/path/to/discordmcp/build/index.js"],
      "env": {
        "DISCORD_TOKEN": "your_discord_bot_token"
      }
    }
  }
}
```

Use an **absolute path** to `build/index.js`. Fully quit and reopen Claude
Desktop after saving — config is only read on launch.

### Claude Code (CLI)

```bash
claude mcp add discord node /absolute/path/to/discordmcp/build/index.js \
  --env DISCORD_TOKEN=your_discord_bot_token
```

Then `claude mcp list` should show `discord`, and `/mcp` inside a session shows
its tools as connected.

---

## 6. Verify

1. Restart the client so it spawns the server.
2. Confirm the `discord` server shows the two tools (`send-message`,
   `read-messages`) as connected.
3. Ask the client to read the last few messages from a known channel, then to
   post a test message. Example prompt: *"Read the last 5 messages in
   #general and reply with a short hello."*
4. If `read-messages` returns blank content, re-check **MESSAGE CONTENT INTENT**
   (§3.3). If the bot can't see a channel, re-check channel permission
   overrides (§3.5).

### Quick troubleshooting

| Symptom | Likely cause |
|---|---|
| Server won't start / "token invalid" | Wrong or rotated `DISCORD_TOKEN`; copied with whitespace |
| Tools never appear in the client | Non-absolute path to `build/index.js`; client not restarted; forgot `npm run build` |
| `read-messages` content empty | MESSAGE CONTENT INTENT disabled |
| "Missing Access" / can't post | Bot lacks `Send Messages` or channel override hides it |
| Bot replies in wrong/duplicate guild | Bot is in multiple servers — pass `server` explicitly to the tools |

---

## 7. Where Claudette plugs in

> **Not built yet — captured here so the wiring is obvious when we start.**

Project Claudette today takes **Instagram DMs** through a fixed pipeline
(`webhook → screener → memory → LLM → messenger`, see
[`../README.md`](../README.md)). Discord becomes a **second inbound/outbound
channel** into that same pipeline.

### Decided: direct bot client

Claudette runs as a **direct `discord.js` bot client** inside Project Claudette
— it listens for message events and calls the *existing* reply pipeline
directly, the Discord analog of `src/webhook/instagram.js` +
`src/instagram/messenger.js`. The MCP server is **not** in Claudette's live
reply loop; it stays a developer-facing tool for manual reading/sending. This
keeps her autonomous responses independent of any MCP host being open.

New pieces (mirroring the Instagram side):

```
src/discord/listener.js     # client.on('messageCreate') → reply pipeline   (≈ webhook/instagram.js)
src/discord/messenger.js    # channel.send(...) for outbound                (≈ instagram/messenger.js)
```

Reused unchanged: `guardrails/screener.js`, `memory/*`, `llm/claudette.js`,
`utils/users.js`. New env vars: `DISCORD_TOKEN` (and optionally a
guild/channel allowlist).

### Memory is unified across platforms — one person, one thread

Claudette is **one persona**, and her memory of a given human must be **shared
across every platform she's on**. If the same person talks to her on Instagram
*and* Discord, she should recognize them as the same person and carry memory
across — not start over per platform.

So the data model keys on a **canonical internal person**, and platform IDs are
**links** to that person, not separate primary keys:

```
people(id PK, display_name, …)                     -- one row per human
identities(person_id → people, platform, platform_user_id)
                                                   -- (instagram, 12345), (discord, 67890) → same person_id
messages(person_id → people, platform, …)          -- platform is just provenance metadata
memories(person_id → people, embedding, …)         -- recall scoped to the person, not the platform
```

- **Memory recall (`match_memories`) scopes by `person_id`**, so it spans every
  linked platform automatically.
- **`platform` is provenance only** — useful for "where did this come from / how
  do I reply," never an identity boundary.
- **Identity linking is the one hard part.** You can't auto-merge an IG user and
  a Discord user without a signal — they're different IDs on different services.
  Plan a lightweight **link flow** (e.g. the person says "it's me from
  Instagram," or a one-time code Claudette issues on one platform and they paste
  on the other) that attaches a new `identities` row to an existing `person_id`.
  Until linked, a new platform identity is simply a new person; linking merges
  them.

> Migration note: today's `users` table keys by IG id. Moving to
> `people` + `identities` is a backfill — wrap it in
> `supabase/migrations/` when we start this, and repoint `memories`/`messages`
> foreign keys at `person_id`.

---

## 8. Security notes

- **Never commit `DISCORD_TOKEN`.** Keep it in `.env` (gitignored) or the MCP
  client's `env` block. Rotate immediately if it leaks (Developer Portal →
  Bot → Reset Token).
- **Least privilege.** Only grant the bot the channels and permissions it needs.
- **Read access is real reach.** With `read-messages`, the MCP client can ingest
  whatever the bot can see — scope channels deliberately.
