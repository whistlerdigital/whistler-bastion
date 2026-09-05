var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.js
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));

// ../src/rules.js
var sensitivePath = /(?:^|[\\/\s"'])(?:\.env(?:\..*)?|\.ssh[\\/]|id_(?:rsa|ed25519)|credentials(?:\.json)?|secrets?\.(?:json|ya?ml)|\.aws[\\/]credentials)(?:$|[\s"'])/i;
var builtinRules = Object.freeze([
  { id: "shell-pipe-exec", decision: "BLOCK", pattern: /(?:curl|wget|irm|Invoke-WebRequest)\b[^|\n]*\|\s*(?:sh|bash|zsh|pwsh|powershell|iex|Invoke-Expression)\b/i, reason: "Remote content is piped directly into an interpreter." },
  { id: "unix-broad-delete", decision: "BLOCK", pattern: /\brm\s+(?:-[^\s]*r[^\s]*f|-[^\s]*f[^\s]*r)\s+(?:\/|~|\$HOME)(?:\s|$)/i, reason: "Recursive deletion targets a broad Unix path." },
  { id: "windows-broad-delete", decision: "BLOCK", pattern: /(?:Remove-Item\s+(?:-[^\n]*Recurse[^\n]*Force|-[^\n]*Force[^\n]*Recurse)[^\n]*(?:[A-Z]:\\|\$env:USERPROFILE)|\b(?:rd|rmdir)\s+\/(?:s|q)[^\n]*(?:[A-Z]:\\|%USERPROFILE%))/i, reason: "Recursive deletion targets a broad Windows path." },
  { id: "filesystem-format", decision: "BLOCK", pattern: /\b(?:mkfs(?:\.\w+)?|format\s+[A-Z]:|diskpart)\b/i, reason: "The command can format or repartition storage." },
  { id: "git-destructive", decision: "CONFIRM", pattern: /\bgit\s+(?:reset\s+--hard|clean\s+-[^\s]*f|checkout\s+--\s+)/i, reason: "The Git operation can discard uncommitted work." },
  { id: "git-force-push", decision: "CONFIRM", pattern: /\bgit\s+push\b[^\n]*(?:--force(?:-with-lease)?|-f\b)/i, reason: "Force push can rewrite shared history." },
  { id: "database-destructive", decision: "CONFIRM", pattern: /\b(?:drop\s+(?:database|schema|table)|truncate\s+table|delete\s+from\s+\S+\s*;?\s*$)/i, reason: "The database operation can remove a large amount of data." },
  { id: "secret-read", decision: "WARN", test: ({ command, paths }) => sensitivePath.test(command) || paths.some((item) => sensitivePath.test(item)), reason: "The operation accesses a commonly sensitive file." },
  { id: "private-key-material", decision: "BLOCK", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, reason: "Private key material must not be passed through operation text." },
  { id: "privilege-escalation", decision: "CONFIRM", pattern: /\b(?:sudo|runas|Start-Process\b[^\n]*-Verb\s+RunAs)\b/i, reason: "The operation requests elevated privileges." },
  { id: "permission-expansion", decision: "CONFIRM", test: ({ permissions }) => permissions.some((item) => /(?:unrestricted|full[-_ ]?access|admin|root|write:\*)/i.test(item)), reason: "The operation requests broad permissions." },
  { id: "production-context", decision: "CONFIRM", test: ({ context }) => context === "production", reason: "Production context requires an explicit confirmation boundary." }
]);

// ../src/policy.js
var DECISIONS = Object.freeze({ ALLOW: 0, WARN: 1, CONFIRM: 2, BLOCK: 3 });
var normalizeRule = (rule) => {
  if (!rule?.id || !Object.hasOwn(DECISIONS, rule.decision) || !rule.pattern && !rule.test) throw new TypeError("Invalid Bastion rule.");
  return rule;
};
function createPolicy(options = {}) {
  const rules = [...options.includeBuiltins === false ? [] : builtinRules, ...options.rules ?? []].map(normalizeRule);
  const ignored = new Set(options.ignoreRules ?? []);
  return { evaluate(input) {
    const operation = { command: String(input?.command ?? "").trim(), context: String(input?.context ?? "local").toLowerCase(), cwd: input?.cwd ? String(input.cwd) : void 0, platform: String(input?.platform ?? process.platform).toLowerCase(), paths: Array.isArray(input?.paths) ? input.paths.map(String) : [], permissions: Array.isArray(input?.permissions) ? input.permissions.map(String) : [] };
    const matches = rules.filter((rule) => !ignored.has(rule.id) && (rule.pattern?.test(operation.command) || rule.test?.(operation)));
    const decision = matches.reduce((current, rule) => DECISIONS[rule.decision] > DECISIONS[current] ? rule.decision : current, "ALLOW");
    return { decision, summary: decision === "ALLOW" ? "No configured risk rule matched." : `${matches.length} policy rule${matches.length === 1 ? "" : "s"} matched.`, reasons: matches.map((rule) => rule.reason), ruleIds: matches.map((rule) => rule.id), operation, policyVersion: "0.2", auditedAt: (/* @__PURE__ */ new Date()).toISOString() };
  } };
}
var defaultPolicy = createPolicy();
var evaluate = (input) => defaultPolicy.evaluate(input);

// ../src/integrations.js
var import_promises = require("node:fs/promises");
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);
var CLIENTS = Object.freeze({
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
  continue: { file: ".continue/mcpServers/whistler-bastion.yaml", format: "yaml", commands: ["continue"] }
});
var exists = async (file) => (0, import_promises.access)(file, import_node_fs.constants.F_OK).then(() => true, () => false);
async function initializeProject(cwd = process.cwd()) {
  const configFile = import_node_path.default.join(cwd, ".bastion.json");
  const ignoreFile = import_node_path.default.join(cwd, ".gitignore");
  let createdConfig = false;
  if (!await exists(configFile)) {
    await (0, import_promises.writeFile)(configFile, `${JSON.stringify({ ignoreRules: [], auditFile: ".bastion/audit.jsonl" }, null, 2)}
`, { flag: "wx" });
    createdConfig = true;
  }
  const ignore = await exists(ignoreFile) ? await (0, import_promises.readFile)(ignoreFile, "utf8") : "";
  const line = ".bastion/audit.jsonl";
  if (!ignore.split(/\r?\n/).includes(line)) await (0, import_promises.writeFile)(ignoreFile, `${ignore}${ignore && !ignore.endsWith("\n") ? "\n" : ""}${line}
`);
  return { configFile, createdConfig, ignoreUpdated: !ignore.split(/\r?\n/).includes(line) };
}
async function diagnose(cwd = process.cwd()) {
  const checks = [{ name: "Node.js 20+", ok: Number(process.versions.node.split(".")[0]) >= 20, detail: process.version }];
  const configFile = import_node_path.default.join(cwd, ".bastion.json");
  checks.push({ name: ".bastion.json", ok: await exists(configFile), detail: import_node_path.default.relative(cwd, configFile) });
  for (const [client, definition] of Object.entries(CLIENTS)) {
    const file = import_node_path.default.join(cwd, definition.file);
    const present = await exists(file);
    const content = present ? await (0, import_promises.readFile)(file, "utf8") : "";
    checks.push({ name: `${client} integration`, ok: !present || content.includes("whistler-bastion"), detail: present ? definition.file : `${definition.file} (not configured)` });
  }
  return { ok: checks.every((check) => check.ok), checks };
}

// src/extension.js
var formatResult = (result) => {
  const reasons = result.reasons.length ? result.reasons.join("\n\u2022 ") : "No policy rule matched.";
  return `${result.decision}: ${result.summary}

\u2022 ${reasons}`;
};
var showResult = (result) => {
  const message = formatResult(result);
  if (result.decision === "BLOCK") return vscode.window.showErrorMessage(message, { modal: true });
  if (result.decision === "CONFIRM") return vscode.window.showWarningMessage(message, { modal: true });
  if (result.decision === "WARN") return vscode.window.showWarningMessage(message);
  return vscode.window.showInformationMessage(message);
};
function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("bastion.evaluateOperation", async () => {
      const editor = vscode.window.activeTextEditor;
      const selected = editor?.document.getText(editor.selection).trim();
      const command = await vscode.window.showInputBox({
        title: "Bastion risk evaluation",
        prompt: "Enter the shell, Git, database or automation operation to evaluate locally.",
        value: selected || "",
        ignoreFocusOut: true
      });
      if (!command) return;
      await showResult(evaluate({
        command,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "",
        platform: process.platform,
        paths: [],
        permissions: []
      }));
    }),
    vscode.commands.registerCommand("bastion.initializeProject", async () => {
      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!cwd) return vscode.window.showWarningMessage("Open a workspace before initializing Bastion.");
      const result = await initializeProject(cwd);
      const detail = result.createdConfig ? "Created .bastion.json." : "Existing .bastion.json was preserved.";
      await vscode.window.showInformationMessage(`Bastion initialized. ${detail}`);
    }),
    vscode.commands.registerCommand("bastion.runDoctor", async () => {
      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
      const report = await diagnose(cwd);
      const output = vscode.window.createOutputChannel("Bastion");
      output.clear();
      output.appendLine(`Bastion diagnostics: ${report.ok ? "PASS" : "ATTENTION REQUIRED"}`);
      for (const check of report.checks) output.appendLine(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
      output.show(true);
    })
  );
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
