# Bastion

Cross-platform, local-first policy guard for developer tools and AI coding agents.

**Designed, developed and maintained by [Whistler Digital](https://whistler.com.tr/open-source/bastion).**

Bastion evaluates a proposed operation before execution and returns one deterministic decision: `ALLOW`, `WARN`, `CONFIRM`, or `BLOCK`. It does not send command, path, permission, or project data to an external service.

## What does Bastion do?

Bastion is a free safety checkpoint placed between an AI coding agent or developer automation and a risky operation. Before a command runs, Bastion evaluates what it is trying to do and explains whether it should proceed, warn the user, ask for confirmation, or stop.

It is useful when an agent or script might accidentally:

- delete a broad directory or workspace;
- force-push or discard Git changes;
- read `.env`, SSH keys or cloud credentials;
- execute destructive database commands;
- elevate permissions or mutate a production system.

## Who is it for?

- Developers using AI coding agents
- Teams running local or CI automation
- Maintainers building MCP-compatible tools
- Node.js applications that need a deterministic preflight policy
- Security-conscious users who want a local audit trail

## Without and with Bastion

| Without Bastion | With Bastion |
| --- | --- |
| A risky command can reach the shell immediately. | The operation receives a policy decision first. |
| Safety depends only on the calling tool's prompt. | Deterministic rules provide a second, local checkpoint. |
| Rejected operations may not have a standard record. | Optional JSONL audit output records evaluated decisions. |
| Each integration invents its own result format. | CLI, SDK, MCP and JSON share the same decision model. |

## Two-minute start

No global installation is required:

```bash
npx @whistlerdigital/bastion --json -- "git push --force origin main"
```

Example result:

```json
{
  "decision": "CONFIRM",
  "reasons": ["Force push can rewrite shared Git history."],
  "matchedRules": ["git-force-push"]
}
```

Connect the SDK, JSON bridge or MCP server to the host that executes operations, then enforce the returned decision before execution.

## Integration surfaces

- Cross-platform CLI for Windows, macOS and Linux
- JavaScript SDK for Node.js tools and agent runtimes
- MCP stdio server exposing `bastion_evaluate`
- JSON stdin/stdout bridge for any language or automation platform
- Optional JSONL audit trail and repository-level `.bastion.json`

These open protocols let Bastion integrate with products that support MCP, subprocess hooks or Node.js packages. No project can truthfully force every AI vendor to invoke a guard automatically; the host must connect Bastion and enforce its result.

## CLI

```bash
npx @whistlerdigital/bastion --json -- "git push --force origin main"
```

```powershell
npx @whistlerdigital/bastion --platform win32 -- "Remove-Item -Recurse -Force C:\\"
```

For language-neutral input:

```bash
echo '{"command":"git reset --hard","context":"production"}' | bastion --stdin --json
```

Exit codes: `0` ALLOW, `2` WARN, `3` CONFIRM, `4` BLOCK.

## Whistler JavaScript SDK

```js
// npm install @whistlerdigital/bastion
import { createPolicy } from "@whistlerdigital/bastion";

const bastion = createPolicy({ ignoreRules: [] });
const result = bastion.evaluate({
  command: "git clean -fd",
  context: "local",
  platform: process.platform,
  paths: [],
  permissions: []
});

if (result.decision === "BLOCK") throw new Error(result.reasons.join("; "));
```

## MCP

Add the following stdio server to an MCP-compatible host:

```json
{
  "mcpServers": {
    "whistler-bastion": {
      "command": "npx",
      "args": ["-y", "--package", "@whistlerdigital/bastion", "bastion-mcp"]
    }
  }
}
```

The server publishes one tool, `bastion_evaluate`. The calling agent should invoke it before a filesystem, shell, Git, database, permission or production mutation and enforce the returned decision.

The package is published publicly from the verified `whistlerdigital` npm account. GitHub installation remains available as a source-based alternative.

## Configuration and audit

`.bastion.json`:

```json
{
  "ignoreRules": [],
  "auditFile": ".bastion/audit.jsonl"
}
```

Audit output is local JSONL. Do not commit it when commands may contain sensitive material.

## Built-in coverage

- Unix and Windows broad recursive deletion
- Remote download piped into shell/PowerShell
- Disk formatting and partitioning
- Destructive Git reset, clean, checkout and force push
- Destructive database commands
- `.env`, SSH, cloud credential and secret-file access
- Embedded private keys
- Privilege escalation and broad tool permissions
- Production-context confirmation boundary

## Security boundary

Bastion is a preflight policy engine. It is not an operating-system sandbox, antivirus product, access-control system, or complete prompt-injection defense. A host that ignores the decision can still execute an operation. Rules reduce known risk patterns; they cannot prove that arbitrary code is safe.

## Frequently asked questions

### Does Bastion execute commands?

No. It evaluates the proposed operation and returns a decision. The calling host remains responsible for execution.

### Does it send source code or commands to Whistler Digital?

No. Evaluation is local and the package has zero runtime dependencies. Audit output is optional and local.

### Does it work with every AI product automatically?

It works with hosts that can call an MCP server, Node.js SDK, subprocess CLI or JSON bridge. The host must be configured to call Bastion and enforce its decision.

### Is it an antivirus or sandbox?

No. Bastion is a preflight policy layer and should complement operating-system permissions, backups, review and sandboxing.

### Which systems are supported?

The CLI and SDK run on Node.js 20 or later on Windows, macOS and Linux. Platform-specific safety rules cover common Unix and PowerShell operations.

## Development

```bash
npm install
npm run check
```

The current suite verifies the SDK policy engine, Windows and Unix rules, permissions, sensitive paths and the MCP stdio protocol.

## Developed by Whistler Digital

Bastion is an open-source Whistler Digital engineering project. Website: [whistler.com.tr](https://whistler.com.tr/) · Security: [info@whistler.com.tr](mailto:info@whistler.com.tr)

## License

[MIT](LICENSE)
