import { builtinRules } from "./rules.js";

export const DECISIONS = Object.freeze({ ALLOW: 0, WARN: 1, CONFIRM: 2, BLOCK: 3 });
const normalizeRule = (rule) => { if (!rule?.id || !Object.hasOwn(DECISIONS, rule.decision) || (!rule.pattern && !rule.test)) throw new TypeError("Invalid Bastion rule."); return rule; };

export function createPolicy(options = {}) {
  const rules = [...(options.includeBuiltins === false ? [] : builtinRules), ...(options.rules ?? [])].map(normalizeRule);
  const ignored = new Set(options.ignoreRules ?? []);
  return { evaluate(input) {
    const operation = { command: String(input?.command ?? "").trim(), context: String(input?.context ?? "local").toLowerCase(), cwd: input?.cwd ? String(input.cwd) : undefined, platform: String(input?.platform ?? process.platform).toLowerCase(), paths: Array.isArray(input?.paths) ? input.paths.map(String) : [], permissions: Array.isArray(input?.permissions) ? input.permissions.map(String) : [] };
    const matches = rules.filter((rule) => !ignored.has(rule.id) && (rule.pattern?.test(operation.command) || rule.test?.(operation)));
    const decision = matches.reduce((current, rule) => DECISIONS[rule.decision] > DECISIONS[current] ? rule.decision : current, "ALLOW");
    return { decision, summary: decision === "ALLOW" ? "No configured risk rule matched." : `${matches.length} policy rule${matches.length === 1 ? "" : "s"} matched.`, reasons: matches.map((rule) => rule.reason), ruleIds: matches.map((rule) => rule.id), operation, policyVersion: "0.2", auditedAt: new Date().toISOString() };
  }};
}
const defaultPolicy = createPolicy();
export const evaluate = (input) => defaultPolicy.evaluate(input);
