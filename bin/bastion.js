#!/usr/bin/env node
import { appendAudit, connectAll, connectClient, createPolicy, detectClients, diagnose, disconnectClient, initializeProject, loadConfig, repair, resolveBase, restoreLatest, setupDetected } from "../src/index.js";
const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
if (args.includes("--help")) { process.stdout.write("Bastion — cross-platform local policy guard\n\nSetup:\n  bastion detect [--global]\n  bastion setup [--global]\n  bastion init\n  bastion connect <client|--all> [--global]\n  bastion doctor [--fix] [--global] [--json]\n  bastion disconnect <client> [--global]\n  bastion restore <client> [--global]\n\nEvaluate:\n  bastion [--json] [--context production] [--platform win32] [--config .bastion.json] [--audit .bastion/audit.jsonl] -- <command>\n\nClients: codex, claude, cursor, vscode, copilot, cline, roo, gemini, windsurf, opencode, continue\nExit codes: 0 ALLOW, 2 WARN, 3 CONFIRM, 4 BLOCK\n"); process.exit(0); }
if (args.includes("--version")) { process.stdout.write("0.4.0\n"); process.exit(0); }
const base = resolveBase({ global: args.includes("--global") });
if (args[0] === "init") { const result = await initializeProject(base); process.stdout.write(`Bastion initialized: ${result.configFile}\n`); process.exit(0); }
if (args[0] === "detect") { const result = await detectClients(base); process.stdout.write(`${args.includes("--json") ? JSON.stringify(result) : result.join("\n") || "No supported client configuration detected."}\n`); process.exit(0); }
if (args[0] === "setup") { const result = await setupDetected({ cwd: base }); process.stdout.write(`Initialized ${result.cwd}; connected ${result.connected.length} detected client(s).\n`); process.exit(0); }
if (args[0] === "connect") { const results = args.includes("--all") ? await connectAll(base) : [await connectClient(args[1], base)]; results.forEach((result) => process.stdout.write(`Connected ${result.client}: ${result.file}${result.backupFile ? ` (backup: ${result.backupFile})` : ""}\n`)); process.exit(0); }
if (args[0] === "doctor") { const result = args.includes("--fix") ? (await repair({ cwd: base })).diagnosis : await diagnose(base); if (args.includes("--json")) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`); else result.checks.forEach((check) => process.stdout.write(`${check.ok ? "PASS" : "MISS"} ${check.name} — ${check.detail}\n`)); process.exit(result.ok ? 0 : 2); }
if (args[0] === "disconnect") { const result = await disconnectClient(args[1], base); process.stdout.write(`${result.changed ? "Disconnected" : "Not connected"} ${args[1]}${result.backupFile ? ` (backup: ${result.backupFile})` : ""}\n`); process.exit(0); }
if (args[0] === "restore") { const result = await restoreLatest(args[1], base); process.stdout.write(`Restored ${args[1]} from ${result.restoredFrom}\n`); process.exit(0); }
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
