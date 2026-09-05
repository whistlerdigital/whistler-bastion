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
export const CLIENTS: Readonly<Record<string, { file: string; format: string }>>;
export function initializeProject(cwd?: string): Promise<{ configFile: string; createdConfig: boolean; ignoreUpdated: boolean }>;
export function connectClient(client: string, cwd?: string): Promise<{ client: string; file: string; backupFile: string | null }>;
export function connectAll(cwd?: string): Promise<Array<{ client: string; file: string; backupFile: string | null }>>;
export function diagnose(cwd?: string): Promise<{ ok: boolean; checks: Array<{ name: string; ok: boolean; detail: string }> }>;
