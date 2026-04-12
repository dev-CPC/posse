# posse

A web UI for [Anthropic Managed Agents](https://docs.anthropic.com/en/docs/agents/managed-agents).

Anthropic ships the best agent infrastructure — sandboxed environments, persistent memory, tool use, multi-agent orchestration — but no UI. You're stuck with curl and the API console.

Posse gives you the missing interface: create agents, run sessions, manage memory stores, and watch your agents work — all from a browser.

![posse](https://github.com/user-attachments/assets/posse-screenshot.png)

## What you get

- **Agent management** — Create, edit, archive, and version agents with different models (Sonnet, Opus, Haiku)
- **Sessions** — Start sessions, send messages, watch tool calls and code execution in real time
- **Memory stores** — Browse and edit persistent memory that agents carry across sessions
- **Environments** — Switch between execution environments with different tools and configurations
- **Multi-agent** — Run multiple agents side by side, each with their own sessions and memory

## Quick start

```bash
# Clone
git clone https://github.com/oguzbilgic/posse.git
cd posse

# Set your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# Run
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

```bash
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  ghcr.io/oguzbilgic/posse:latest
```

## How it works

Posse is a lightweight Next.js app that proxies requests to the [Anthropic API](https://docs.anthropic.com/en/docs/agents/managed-agents). Your API key stays server-side — never exposed to the browser.

The entire app is ~13k lines of TypeScript with zero backend dependencies beyond Next.js. No database, no auth layer, no state server. It reads everything from the Anthropic API and renders it.

### Stack

- Next.js 16 + React 19
- TypeScript + Tailwind CSS
- Zustand for client state
- Marked + highlight.js for markdown/code rendering

## Why

Anthropic's managed agents are powerful but invisible. You define agents in JSON, create sessions via API, and parse events from streams. It works, but you can't *see* what's happening.

With posse, you get a real workspace: watch an agent write code, see it execute bash commands, check what it stored in memory, start a new session with a different environment. The kind of feedback loop you need when building with agents.

## Status

Early. Shipping fast. Core features work — agents, sessions, chat, memory, environments. What's next:

- [ ] SSE streaming (currently polling)
- [ ] File upload / media attachments
- [ ] Session event filtering and search
- [ ] Agent skill configuration UI
- [ ] Callable agent orchestration view

## License

MIT
