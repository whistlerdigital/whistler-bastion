import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export const CLIENTS = Object.freeze({
  codex: { file: ".codex/config.toml", format: "toml" },
  claude: { file: ".mcp.json", format: "json" },
  cursor: { file: ".cursor/mcp.json", format: "json" },
  vscode: { file: ".vscode/mcp.json", format: "vscode" },
  copilot: { file: ".vscode/mcp.json", format: "vscode" },
  cline: { file: ".cline/mcp.json", format: "json" },
  roo: { file: ".roo/mcp.json", format: "json" },
  gemini: { file: ".gemini/settings.json", format: "json" },
  windsurf: { file: ".windsurf/mcp_config.json", format: "json" },
  opencode: { file: "opencode.json", format: "opencode" },
  continue: { file: ".continue/mcpServers/whistler-bastion.yaml", format: "yaml" },
});

const server = { command: "npx", args: ["-y", "--package", "@whistlerdigital/bastion", "bastion-mcp"] };
const exists = async (file) => access(file, constants.F_OK).then(() => true, () => false);

async function backup(file) {
  if (!(await exists(file))) return null;
  const target = `${file}.bastion-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await copyFile(file, target);
  return target;
}

export async function initializeProject(cwd = process.cwd()) {
  const configFile = path.join(cwd, ".bastion.json");
  const ignoreFile = path.join(cwd, ".gitignore");
  let createdConfig = false;
  if (!(await exists(configFile))) {
    await writeFile(configFile, `${JSON.stringify({ ignoreRules: [], auditFile: ".bastion/audit.jsonl" }, null, 2)}\n`, { flag: "wx" });
    createdConfig = true;
  }
  const ignore = (await exists(ignoreFile)) ? await readFile(ignoreFile, "utf8") : "";
  const line = ".bastion/audit.jsonl";
  if (!ignore.split(/\r?\n/).includes(line)) await writeFile(ignoreFile, `${ignore}${ignore && !ignore.endsWith("\n") ? "\n" : ""}${line}\n`);
  return { configFile, createdConfig, ignoreUpdated: !ignore.split(/\r?\n/).includes(line) };
}

export async function connectClient(client, cwd = process.cwd()) {
  const definition = CLIENTS[client];
  if (!definition) throw new Error(`Unsupported client: ${client}. Use one of: ${Object.keys(CLIENTS).join(", ")}`);
  const file = path.join(cwd, definition.file);
  await mkdir(path.dirname(file), { recursive: true });
  const backupFile = await backup(file);
  if (definition.format === "toml") {
    const current = (await exists(file)) ? await readFile(file, "utf8") : "";
    if (!current.includes("[mcp_servers.whistler-bastion]")) {
      const block = '\n[mcp_servers.whistler-bastion]\ncommand = "npx"\nargs = ["-y", "--package", "@whistlerdigital/bastion", "bastion-mcp"]\n';
      await writeFile(file, `${current.trimEnd()}${block}`);
    }
  } else if (definition.format === "yaml") {
    await writeFile(file, 'name: whistler-bastion\ncommand: npx\nargs:\n  - -y\n  - --package\n  - "@whistlerdigital/bastion"\n  - bastion-mcp\n');
  } else {
    let current = {};
    if (await exists(file)) {
      try { current = JSON.parse(await readFile(file, "utf8")); }
      catch { throw new Error(`Invalid JSON in ${definition.file}; original file was not changed.`); }
    }
    const key = definition.format === "vscode" ? "servers" : definition.format === "opencode" ? "mcp" : "mcpServers";
    const clientServer = definition.format === "opencode"
      ? { type: "local", command: ["npx", "-y", "--package", "@whistlerdigital/bastion", "bastion-mcp"], enabled: true }
      : server;
    current[key] = { ...(current[key] ?? {}), "whistler-bastion": clientServer };
    await writeFile(file, `${JSON.stringify(current, null, 2)}\n`);
  }
  return { client, file, backupFile };
}

export async function connectAll(cwd = process.cwd()) {
  const results = [];
  for (const client of Object.keys(CLIENTS)) results.push(await connectClient(client, cwd));
  return results;
}

export async function diagnose(cwd = process.cwd()) {
  const checks = [{ name: "Node.js 20+", ok: Number(process.versions.node.split(".")[0]) >= 20, detail: process.version }];
  const configFile = path.join(cwd, ".bastion.json");
  checks.push({ name: ".bastion.json", ok: await exists(configFile), detail: path.relative(cwd, configFile) });
  for (const [client, definition] of Object.entries(CLIENTS)) {
    const file = path.join(cwd, definition.file);
    const present = await exists(file);
    const content = present ? await readFile(file, "utf8") : "";
    checks.push({ name: `${client} integration`, ok: present && content.includes("whistler-bastion"), detail: definition.file });
  }
  return { ok: checks.every((check) => check.ok), checks };
}
