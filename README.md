# Bastion

Cross-platform, local-first policy guard for developer tools and AI coding agents.

**Designed, developed and maintained by [Whistler Digital](https://whistler.com.tr/open-source/bastion).**

Bastion evaluates a proposed operation before execution and returns one deterministic decision: `ALLOW`, `WARN`, `CONFIRM`, or `BLOCK`. It does not send command, path, permission, or project data to an external service.

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
