# Documentation Index

Welcome to the LSP Indexer documentation.

## Core Documentation

- **[Architecture](./ARCHITECTURE.md)** — System design, patterns, and technical overview
- **[Contributing](./CONTRIBUTING.md)** — How to contribute to the project
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** — Community guidelines and expectations

## Developer Guides

- **[AI Agents Guide](./AGENTS.md)** — Guidelines for AI coding agents (Claude, GitHub Copilot, etc.)
- **[Claude Configuration](./CLAUDE.md)** — Claude-specific project configuration

## Deployment

- **[Docker Setup](./docker/)** — Complete Docker deployment guides
  - [Quickstart](./docker/QUICKSTART.md) — Get running in 5 minutes
  - [Reference Manual](./docker/REFERENCE.md) — Comprehensive setup guide

## Additional Resources

- **[Main README](../README.md)** — Project overview and getting started
- **[Planning Artifacts](../.planning/)** — GSD project planning and roadmaps
- **[Package Documentation](../packages/)** — Individual package docs
  - [abi](../packages/abi/) — Contract ABIs
  - [typeorm](../packages/typeorm/) — Database entities and migrations
  - [indexer](../packages/indexer/) — Legacy indexer (v1)
  - [indexer-v2](../packages/indexer-v2/) — Current indexer with plugin architecture

## Quick Links

| Topic                 | Link                                           |
| --------------------- | ---------------------------------------------- |
| Docker v2 Setup       | [docker/QUICKSTART.md](./docker/QUICKSTART.md) |
| Architecture Overview | [ARCHITECTURE.md](./ARCHITECTURE.md)           |
| How to Contribute     | [CONTRIBUTING.md](./CONTRIBUTING.md)           |
| AI Agent Guidelines   | [AGENTS.md](./AGENTS.md)                       |

## Structure

```
docs/
├── README.md              # This file
├── ARCHITECTURE.md        # System architecture
├── CONTRIBUTING.md        # Contribution guide
├── CODE_OF_CONDUCT.md     # Community standards
├── AGENTS.md              # AI agent guidelines
├── CLAUDE.md              # Claude config
└── docker/                # Docker documentation
    ├── README.md          # Docker docs index
    ├── QUICKSTART.md      # Quick start
    └── REFERENCE.md       # Full reference
```
