export type Decision = "ALLOW" | "WARN" | "CONFIRM" | "BLOCK";
export interface Operation { command: string; context?: string; cwd?: string; platform?: string; paths?: string[]; permissions?: string[]; }
export interface Evaluation { decision: Decision; summary: string; reasons: string[]; ruleIds: string[]; operation: Required<Pick<Operation, "command">> & Omit<Operation, "command">; policyVersion: string; auditedAt: string; }
export interface PolicyRule { id: string; decision: Decision; reason: string; pattern?: RegExp; test?: (operation: Operation) => boolean; }
export function evaluate(operation: Operation): Evaluation;
export function createPolicy(options?: { includeBuiltins?: boolean; ignoreRules?: string[]; rules?: PolicyRule[] }): { evaluate(operation: Operation): Evaluation };
export const DECISIONS: Readonly<Record<Decision, number>>;
export const builtinRules: readonly PolicyRule[];
export function loadConfig(filename?: string, cwd?: string): Promise<Record<string, unknown>>;
export function appendAudit(result: Evaluation, filename?: string): Promise<void>;
