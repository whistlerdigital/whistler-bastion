#!/usr/bin/env node
import { appendAudit, createPolicy, loadConfig } from "../src/index.js";
const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
if (args.includes("--help")) { process.stdout.write("Bastion — cross-platform local policy guard\n\nUsage:\n  bastion [--json] [--context production] [--platform win32] [--config .bastion.json] [--audit .bastion/audit.jsonl] -- <command>\n  echo '{\"command\":\"git status\"}' | bastion --stdin --json\n\nExit codes: 0 ALLOW, 2 WARN, 3 CONFIRM, 4 BLOCK\n"); process.exit(0); }
if (args.includes("--version")) { process.stdout.write("0.2.0\n"); process.exit(0); }
const stdinMode = args.includes("--stdin");
const separator = args.indexOf("--");
let input;
if (stdinMode) { const chunks = []; for await (const chunk of process.stdin) chunks.push(chunk); input = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
else { const ignored = new Set(["--json", "--stdin", "--context", valueAfter("--context"), "--platform", valueAfter("--platform"), "--config", valueAfter("--config"), "--audit", valueAfter("--audit")]); input = { command: (separator >= 0 ? args.slice(separator + 1) : args.filter((arg) => !ignored.has(arg))).join(" "), context: valueAfter("--context"), platform: valueAfter("--platform") }; }
if (!input?.command) { process.stderr.write("Bastion: command is required. Use --help.\n"); process.exit(1); }
const config = await loadConfig(valueAfter("--config"));
const result = createPolicy({ ignoreRules: config.ignoreRules }).evaluate(input);
await appendAudit(result, valueAfter("--audit") ?? config.auditFile);
if (args.includes("--json") || stdinMode) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
else { process.stdout.write(`${result.decision}: ${result.summary}\n`); result.reasons.forEach((reason) => process.stdout.write(`- ${reason}\n`)); }
process.exit({ ALLOW: 0, WARN: 2, CONFIRM: 3, BLOCK: 4 }[result.decision]);
