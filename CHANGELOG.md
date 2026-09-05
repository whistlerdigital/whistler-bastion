# Changelog

## 0.4.2 - 2026-09-05

- Added the official Bastion product icon with high-contrast white symbols.
- Added consistent Bastion and Whistler Digital attribution to GitHub and npm presentation.
- Included the product icon in the published npm package.

All notable changes to Bastion are documented here.

## 0.4.1 — 2026-09-05

- Detects executable clients and existing configuration independently.
- Reports whether discovery came from a command or configuration path.
- Writes changed integration files atomically.
- Adds a real CLI subprocess lifecycle acceptance test.

## 0.4.0 — 2026-09-05

### Added

- `detect` and `setup` for configured-client discovery and guided project setup.
- `--global` support for user-level configuration locations.
- `doctor --fix` for safe configuration repair.
- `disconnect` and `restore` with timestamped recovery copies.
- Windows, macOS and Linux CI across Node.js 20 and 22.
- Reversible integration lifecycle tests.

## 0.3.0 — 2026-09-05

### Added

- `bastion init` for safe project defaults.
- `bastion connect <client>` and `bastion connect --all` for project-local MCP configuration.
- `bastion doctor` for Node.js, project configuration and client integration checks.
- Adapters for Codex, Claude, Cursor, VS Code, GitHub Copilot, Cline, Roo Code, Gemini CLI, Windsurf, OpenCode and Continue.
- Timestamped backups before changing an existing client configuration.
- Native configuration schemas for VS Code/GitHub Copilot and OpenCode.
- Expanded integration test coverage; 15 automated tests pass.

### Install

```bash
npx @whistlerdigital/bastion
```

Designed, developed and maintained by [Whistler Digital](https://whistler.com.tr/open-source/bastion).

## 0.2.2 — 2026-09-05

- Synchronized CLI and MCP server version metadata.

## 0.2.1 — 2026-09-05

- Expanded the public documentation with practical use cases, quick start, comparison and FAQ sections.

## 0.2.0 — 2026-09-05

- Added the cross-platform CLI, JavaScript/TypeScript SDK, MCP stdio server, JSON bridge, local audit output and configurable policies.
