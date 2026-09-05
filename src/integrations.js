import { access, copyFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

export const CLIENTS = Object.freeze({
  codex: { file: ".codex/config.toml", format: "toml", commands: ["codex"] },
  claude: { file: ".mcp.json", format: "json", commands: ["claude"] },
  cursor: { file: ".cursor/mcp.json", format: "json", commands: ["cursor"] },
  vscode: { file: ".vscode/mcp.json", format: "vscode", commands: ["code"] },
  copilot: { file: ".vscode/mcp.json", format: "vscode", commands: ["code"] },
  cline: { file: ".cline/mcp.json", format: "json", commands: [] },
  roo: { file: ".roo/mcp.json", format: "json", commands: [] },
  gemini: { file: ".gemini/settings.json", format: "json", commands: ["gemini"] },
  windsurf: { file: ".windsurf/mcp_config.json", format: "json", commands: ["windsurf"] },
  opencode: { file: "opencode.json", format: "opencode", commands: ["opencode"] },
  continue: { file: ".continue/mcpServers/whistler-bastion.yaml", format: "yaml", commands: ["continue"] },
});

const server = { command: "npx", args: ["-y", "--package", "@whistlerdigital/bastion", "bastion-mcp"] };
const exists = async (file) => access(file, constants.F_OK).then(() => true, () => false);
export const resolveBase = (options = {}) => options.global ? homedir() : (options.cwd ?? process.cwd());
const commandExists = (command) => spawnSync(process.platform === "win32" ? "where" : "which", [command], { stdio: "ignore", shell: false }).status === 0;
async function atomicWrite(file, content) {
  const temporary = `${file}.bastion-write-${process.pid}`;
  await writeFile(temporary, content, { flag: "wx" });
  await rename(temporary, file);
}

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
      await atomicWrite(file, `${current.trimEnd()}${block}`);
    }
  } else if (definition.format === "yaml") {
    await atomicWrite(file, 'name: whistler-bastion\ncommand: npx\nargs:\n  - -y\n  - --package\n  - "@whistlerdigital/bastion"\n  - bastion-mcp\n');
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
    await atomicWrite(file, `${JSON.stringify(current, null, 2)}\n`);
  }
  return { client, file, backupFile };
}

export async function detectClients(cwd = process.cwd()) {
  return (await detectClientsDetailed(cwd)).filter((item) => item.detected).map((item) => item.client);
}

export async function detectClientsDetailed(cwd = process.cwd()) {
  const results = [];
  for (const [client, definition] of Object.entries(CLIENTS)) {
    const file = path.join(cwd, definition.file);
    const parent = path.dirname(file);
    const configFound = await exists(file) || (parent !== cwd && await exists(parent));
    const commandFound = definition.commands.some(commandExists);
    results.push({ client, detected: configFound || commandFound, configFound, commandFound, file });
  }
  return results;
}

export async function setupDetected(options = {}) {
  const cwd = resolveBase(options);
  const initialized = await initializeProject(cwd);
  const clients = options.clients?.length ? options.clients : await detectClients(cwd);
  const connected = [];
  for (const client of clients) connected.push(await connectClient(client, cwd));
  return { cwd, initialized, detected: clients, connected };
}

export async function disconnectClient(client, cwd = process.cwd()) {
  const definition = CLIENTS[client];
  if (!definition) throw new Error(`Unsupported client: ${client}`);
  const file = path.join(cwd, definition.file);
  if (!(await exists(file))) return { client, file, changed: false, backupFile: null };
  const backupFile = await backup(file);
  if (definition.format === "toml") {
    const current = await readFile(file, "utf8");
    await atomicWrite(file, current.replace(/\n?\[mcp_servers\.whistler-bastion\]\ncommand = "npx"\nargs = \[[^\n]+\]\n?/g, "\n"));
  } else if (definition.format === "yaml") {
    await atomicWrite(file, "");
  } else {
    const current = JSON.parse(await readFile(file, "utf8"));
    const key = definition.format === "vscode" ? "servers" : definition.format === "opencode" ? "mcp" : "mcpServers";
    if (current[key]) delete current[key]["whistler-bastion"];
    await atomicWrite(file, `${JSON.stringify(current, null, 2)}\n`);
  }
  return { client, file, changed: true, backupFile };
}

export async function restoreLatest(client, cwd = process.cwd()) {
  const definition = CLIENTS[client];
  if (!definition) throw new Error(`Unsupported client: ${client}`);
  const file = path.join(cwd, definition.file);
  const directory = path.dirname(file);
  const prefix = `${path.basename(file)}.bastion-backup-`;
  const backups = (await readdir(directory).catch(() => [])).filter((name) => name.startsWith(prefix)).sort().reverse();
  if (!backups.length) throw new Error(`No Bastion backup found for ${client}.`);
  const safetyCopy = await backup(file);
  await copyFile(path.join(directory, backups[0]), file);
  return { client, file, restoredFrom: path.join(directory, backups[0]), safetyCopy };
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
    checks.push({ name: `${client} integration`, ok: !present || content.includes("whistler-bastion"), detail: present ? definition.file : `${definition.file} (not configured)` });
  }
  return { ok: checks.every((check) => check.ok), checks };
}

export async function repair(options = {}) {
  const cwd = resolveBase(options);
  await initializeProject(cwd);
  const clients = options.clients?.length ? options.clients : await detectClients(cwd);
  const repaired = [];
  for (const client of clients) repaired.push(await connectClient(client, cwd));
  return { cwd, repaired, diagnosis: await diagnose(cwd) };
}
