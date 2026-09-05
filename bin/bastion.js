#!/usr/bin/env node
import { appendAudit, connectAll, connectClient, createPolicy, diagnose, initializeProject, loadConfig } from "../src/index.js";
const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
if (args.includes("--help")) { process.stdout.write("Bastion — cross-platform local policy guard\n\nSetup:\n  bastion init\n  bastion connect <client|--all>\n  bastion doctor [--json]\n\nEvaluate:\n  bastion [--json] [--context production] [--platform win32] [--config .bastion.json] [--audit .bastion/audit.jsonl] -- <command>\n  echo '{\"command\":\"git status\"}' | bastion --stdin --json\n\nClients: codex, claude, cursor, vscode, copilot, cline, roo, gemini, windsurf, opencode, continue\nExit codes: 0 ALLOW, 2 WARN, 3 CONFIRM, 4 BLOCK\n"); process.exit(0); }
if (args.includes("--version")) { process.stdout.write("0.3.0\n"); process.exit(0); }
if (args[0] === "init") { const result = await initializeProject(); process.stdout.write(`Bastion initialized: ${result.configFile}\n`); process.exit(0); }
if (args[0] === "connect") { const results = args.includes("--all") ? await connectAll() : [await connectClient(args[1])]; results.forEach((result) => process.stdout.write(`Connected ${result.client}: ${result.file}${result.backupFile ? ` (backup: ${result.backupFile})` : ""}\n`)); process.exit(0); }
if (args[0] === "doctor") { const result = await diagnose(); if (args.includes("--json")) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`); else result.checks.forEach((check) => process.stdout.write(`${check.ok ? "PASS" : "MISS"} ${check.name} — ${check.detail}\n`)); process.exit(result.ok ? 0 : 2); }
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
