<p align="center">
  <a href="https://whistler.com.tr/open-source/bastion">
    <img src="https://raw.githubusercontent.com/whistlerdigital/whistler-bastion/main/assets/bastion-icon-v3.png" width="150" height="150" alt="Bastion product logo">
  </a>
</p>

# Bastion — AI Agent Safety Guard

<p align="center"><strong>A local safety checkpoint for developer tools and AI coding agents.</strong></p>

**Designed, developed and maintained by [Whistler Digital](https://whistler.com.tr/open-source/bastion).**

Bastion reviews a proposed shell, Git, database or automation operation before it runs and returns one deterministic decision: `ALLOW`, `WARN`, `CONFIRM` or `BLOCK`. It adds a local policy checkpoint to AI-assisted development without sending your commands or source code to an external service.

## Why Bastion?

AI coding agents and automations can move quickly, but a single overly broad command can delete files, expose credentials or rewrite shared history. Bastion gives developers a readable second opinion before risky work reaches the operating system.

It can identify operations involving:

- broad recursive deletion on Windows, macOS and Linux;
- destructive Git reset, clean, checkout and force push;
- remote downloads piped directly into a shell;
- destructive database commands;
- `.env`, SSH keys and cloud credential files;
- embedded private keys and privilege escalation;
- production-context changes that should require confirmation.

## Commands in VS Code

Open the Command Palette with `Ctrl+Shift+P` or `Cmd+Shift+P`, then choose:

### Bastion: Evaluate Risky Operation

Paste or select a command and receive a local risk decision with the rules and reasons that matched.

### Bastion: Initialize Project

Create safe project defaults in `.bastion.json`. Existing configuration is preserved.

### Bastion: Run Diagnostics

Inspect the current workspace integration and open a readable diagnostic report in the Bastion output channel.

## Example

Evaluate a potentially destructive Git command:

```text
git push --force origin main
```

Bastion returns `CONFIRM` and explains that force-pushing can rewrite shared Git history. A broad recursive deletion or remote shell pipe can return `BLOCK`.

## More than a VS Code extension

The same open-source policy engine is available as:

- a cross-platform CLI for Windows, macOS and Linux;
- a JavaScript SDK for Node.js tools and agent runtimes;
- an MCP stdio server exposing `bastion_evaluate`;
- a JSON stdin/stdout bridge for language-neutral integrations;
- project-local adapters for Codex, Claude, Cursor, GitHub Copilot, Cline, Roo Code, Gemini CLI, Windsurf, OpenCode and Continue.

Quick CLI evaluation:

```bash
npx @whistlerdigital/bastion --json -- "git push --force origin main"
```

## Privacy by design

- Evaluation happens locally.
- Commands, paths, permissions and source code are not transmitted to Whistler Digital.
- The package has no runtime dependencies.
- Optional audit records remain in a local JSONL file controlled by the user.

## Security boundary

Bastion is a preflight policy layer, not an operating-system sandbox, antivirus product or complete prompt-injection defense. The calling tool must invoke Bastion and enforce its result. Use it together with least-privilege permissions, backups, code review and isolated execution environments.

## Open source and support

- [Bastion product page](https://whistler.com.tr/open-source/bastion)
- [Source code and complete documentation](https://github.com/whistlerdigital/whistler-bastion)
- [Issue tracker](https://github.com/whistlerdigital/whistler-bastion/issues)
- [Whistler Digital](https://whistler.com.tr/)
- [Security contact](mailto:info@whistler.com.tr)

Released under the MIT License. Copyright Whistler Digital.
