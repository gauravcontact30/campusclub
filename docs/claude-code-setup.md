# Claude Code setup for HomeMart

Agent tooling for people working on this repo. Two of the six are **already
wired into the repository**; the other four install into your own machine
(`~/.claude`), not into the project, so they are one command each.

Everything below was checked against the npm registry on 2 September 2026 —
versions are what `latest` resolved to that day.

---

## Already configured in this repo

### 1. Playwright MCP — `@playwright/mcp@0.0.80`

Lets Claude drive a real browser: click through the directory, fill the review
form, take screenshots, read console errors. Registered in [`.mcp.json`](../.mcp.json).

Claude Code will ask you to approve the server the first time you open the repo
(project MCP servers are never auto-trusted, which is why this repo does **not**
set `enableAllProjectMcpServers`). Approve it once and it is available in every
session here.

The browser binaries come from `@playwright/test`, which this project already
depends on. If the MCP server reports a missing browser:

```bash
npx playwright install chromium
```

On a machine where Chromium already lives at a fixed path, point the e2e suite
at it with `PLAYWRIGHT_CHROMIUM_PATH` (see `playwright.config.ts`).

### 2. Figma MCP

Already connected at the **Claude account** level — nothing to install in this
repo. Its tools (`get_design_context`, `get_screenshot`, `use_figma`,
`get_code_connect_map`, …) are live in any session where the connector is
enabled for that chat.

If a teammate does not see the Figma tools, they connect it themselves at
**claude.ai → Settings → Connectors**, then enable it for the chat. Because it
is an account-level connector rather than a project server, it deliberately does
not belong in `.mcp.json`.

---

## Install on your own machine

These four are user-scoped CLIs. They register hooks, plugins or a local service
under your home directory, so a committed repo file cannot install them for you.

### 3. Impeccable — `impeccable@3.6.1`

Design-quality skills plus a deterministic scanner for 61 UI anti-patterns —
"AI slop" tells, accessibility violations, general design smells. Given this app
is a design-led product, this is the one with the most direct payoff.

```bash
npx impeccable skills install -y --providers=claude --scope=project
```

`--scope=project` writes the skills into `.claude/skills/` **in this repo**, so
run it from the repo root and commit the result if the team wants it shared.
Then, inside Claude Code:

```
/impeccable init
```

Scan without installing anything:

```bash
npx impeccable detect src/
npx impeccable detect --json src/     # for CI
```

Source: <https://impeccable.style> · <https://github.com/pbakaus/impeccable>

### 4. Claude Mem — `claude-mem@13.23.1`

Compresses and persists context between Claude Code sessions, so a new session
starts knowing what the last one did.

Cleanest path, from inside Claude Code:

```
/plugin install claude-mem
```

Or from a terminal:

```bash
npx claude-mem install
```

**Before you run it**, two things worth knowing:

- It registers Claude Code **hooks**, so it runs on every session in every
  project, not just this one.
- The installer asks you to sign in via a browser magic link, which provisions a
  hosted "memory key". To skip that entirely, pass an explicit `--provider`, or
  set `CLAUDE_MEM_ONLINE_OPTIN=false`. Note that `npm install -g claude-mem`
  installs the library only and does **not** register the hooks.

Source: <https://github.com/thedotmack/claude-mem>

### 5. Find Skills — `findskills@0.2.5`

Searches a catalogue of ~93,000 agent skills from the terminal.

```bash
npx findskills <query>
```

Source: <https://findskills.org>

### 6. OmniRoute — `omniroute@3.8.50`

```bash
npm install -g omniroute
# serves an OpenAI-compatible endpoint on http://localhost:20128/v1
```

**Read this before installing.** OmniRoute is not a Claude Code skill — it is a
model *router*: an OpenAI-compatible proxy that fans requests out across ~352
providers, with fallback, compression and an optional transparent MITM/TPROXY
mode for intercepting CLIs that ignore proxy environment variables.

That means prompts and code you send through it leave for whichever provider it
selects. It is a deliberate, account-wide decision about where your traffic goes
— not a per-repo convenience — so it is documented here rather than configured
for you. It also has nothing to do with the HomeMart application itself and is
intentionally not a dependency of this project.

---

## Project permissions

[`.claude/settings.json`](../.claude/settings.json) pre-approves the routine
commands for this repo — `npm run build`, `npm test`, `npm run lint`,
`npm run typecheck`, the Playwright and Vitest runners, and read-only git — so
sessions are not interrupted by prompts for the obvious things.

It also **denies** reads of `.env`, `.env.local` and `.env.*.local`, keeping
Supabase keys out of the model's context by default.

To loosen or tighten this for yourself without changing it for the team, use
`.claude/settings.local.json` (gitignored) — local settings override project
settings.
