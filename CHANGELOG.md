# Changelog

## v0.1.0

Initial release.

### Features
- **Agent management** — List, create, edit, archive agents; view version history; archived agents shown in collapsible sidebar group
- **Sessions** — Create sessions with environment selection, list per-agent sessions, send messages, poll for agent responses
- **Chat UI** — Render agent messages, tool calls (`bash`, `write`, etc.), tool results with syntax highlighting and markdown
- **Memory stores** — Browse memory stores, view individual memories, graceful fallback if API tier doesn't support it
- **Environments** — List and select execution environments, detail modal with full config
- **Docker** — Production Dockerfile with standalone Next.js output (`ghcr.io/oguzbilgic/posse`)
- **Server-side API key** — Anthropic key stays in `.env.local`, proxied through Next.js API route, never exposed to browser
