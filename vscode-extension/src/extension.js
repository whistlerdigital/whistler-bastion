import * as vscode from "vscode";
import { evaluate } from "../../src/policy.js";
import { diagnose, initializeProject } from "../../src/integrations.js";

const formatResult = (result) => {
  const reasons = result.reasons.length ? result.reasons.join("\n• ") : "No policy rule matched.";
  return `${result.decision}: ${result.summary}\n\n• ${reasons}`;
};

const showResult = (result) => {
  const message = formatResult(result);
  if (result.decision === "BLOCK") return vscode.window.showErrorMessage(message, { modal: true });
  if (result.decision === "CONFIRM") return vscode.window.showWarningMessage(message, { modal: true });
  if (result.decision === "WARN") return vscode.window.showWarningMessage(message);
  return vscode.window.showInformationMessage(message);
};

export function activate(context) {
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

export function deactivate() {}
