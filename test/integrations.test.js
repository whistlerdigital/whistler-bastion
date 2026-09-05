import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { connectClient, detectClients, diagnose, disconnectClient, initializeProject, restoreLatest } from "../src/integrations.js";

test("init creates safe project defaults without duplicating gitignore", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "bastion-init-"));
  try {
    await writeFile(path.join(cwd, ".gitignore"), "node_modules\n");
    await initializeProject(cwd);
    await initializeProject(cwd);
    assert.deepEqual(JSON.parse(await readFile(path.join(cwd, ".bastion.json"), "utf8")), { ignoreRules: [], auditFile: ".bastion/audit.jsonl" });
    assert.equal((await readFile(path.join(cwd, ".gitignore"), "utf8")).match(/\.bastion\/audit\.jsonl/g)?.length, 1);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("connect merges MCP config and preserves existing servers", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "bastion-connect-"));
  try {
    await writeFile(path.join(cwd, ".mcp.json"), JSON.stringify({ mcpServers: { existing: { command: "existing" } } }));
    const result = await connectClient("claude", cwd);
    const config = JSON.parse(await readFile(path.join(cwd, ".mcp.json"), "utf8"));
    assert.equal(config.mcpServers.existing.command, "existing");
    assert.equal(config.mcpServers["whistler-bastion"].command, "npx");
    assert.ok(result.backupFile);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("doctor detects initialized project and connected client", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "bastion-doctor-"));
  try {
    await initializeProject(cwd);
    await connectClient("cursor", cwd);
    const result = await diagnose(cwd);
    assert.equal(result.checks.find((check) => check.name === ".bastion.json")?.ok, true);
    assert.equal(result.checks.find((check) => check.name === "cursor integration")?.ok, true);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("VS Code and OpenCode receive their native MCP schemas", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "bastion-native-schema-"));
  try {
    await connectClient("vscode", cwd);
    await connectClient("opencode", cwd);
    const vscode = JSON.parse(await readFile(path.join(cwd, ".vscode/mcp.json"), "utf8"));
    const opencode = JSON.parse(await readFile(path.join(cwd, "opencode.json"), "utf8"));
    assert.equal(vscode.servers["whistler-bastion"].command, "npx");
    assert.deepEqual(opencode.mcp["whistler-bastion"].command.slice(0, 2), ["npx", "-y"]);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("detect, disconnect and restore preserve a reversible client configuration", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "bastion-lifecycle-"));
  try {
    await connectClient("cursor", cwd);
    assert.ok((await detectClients(cwd)).includes("cursor"));
    const disconnected = await disconnectClient("cursor", cwd);
    assert.equal(disconnected.changed, true);
    assert.equal((await readFile(path.join(cwd, ".cursor/mcp.json"), "utf8")).includes("whistler-bastion"), false);
    await restoreLatest("cursor", cwd);
    assert.equal((await readFile(path.join(cwd, ".cursor/mcp.json"), "utf8")).includes("whistler-bastion"), true);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
