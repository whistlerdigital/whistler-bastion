#!/usr/bin/env node
import { evaluate } from "../src/policy.js";

const args = process.argv.slice(2);
if (args.includes("--help") || args.length === 0) {
  process.stdout.write("Bastion — local command policy guard\n\nUsage: bastion [--json] [--context production] -- <command>\n       bastion --version\n\nExit codes: 0 ALLOW, 2 WARN, 3 CONFIRM, 4 BLOCK\n");
  process.exit(0);
}
if (args.includes("--version")) {
  process.stdout.write("0.1.0\n");
  process.exit(0);
}
const json = args.includes("--json");
const separator = args.indexOf("--");
const contextIndex = args.indexOf("--context");
const context = contextIndex >= 0 ? args[contextIndex + 1] : "local";
const command = (separator >= 0 ? args.slice(separator + 1) : args.filter((arg, index) => arg !== "--json" && index !== contextIndex && index !== contextIndex + 1)).join(" ").trim();
if (!command) {
  process.stderr.write("Bastion: command is required. Use --help.\n");
  process.exit(1);
}
const result = evaluate({ command, context });
if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
else {
  process.stdout.write(`${result.decision}: ${result.summary}\n`);
  for (const reason of result.reasons) process.stdout.write(`- ${reason}\n`);
}
process.exit({ ALLOW: 0, WARN: 2, CONFIRM: 3, BLOCK: 4 }[result.decision]);
