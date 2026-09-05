const rules = [
  { id: "shell-pipe-exec", decision: "BLOCK", pattern: /(?:curl|wget)\b[^|\n]*\|\s*(?:sh|bash|zsh)\b/i, reason: "Remote content is piped directly into a shell." },
  { id: "root-recursive-delete", decision: "BLOCK", pattern: /\brm\s+(?:-[^\s]*r[^\s]*f|-[^\s]*f[^\s]*r)\s+(?:\/|~|\$HOME)(?:\s|$)/i, reason: "Recursive deletion targets a broad or home path." },
  { id: "git-destructive-reset", decision: "CONFIRM", pattern: /\bgit\s+reset\s+--hard\b/i, reason: "Hard reset can permanently discard local work." },
  { id: "git-force-push", decision: "CONFIRM", pattern: /\bgit\s+push\b[^\n]*(?:--force|-f\b)/i, reason: "Force push can rewrite shared history." },
  { id: "database-destructive", decision: "CONFIRM", pattern: /\b(?:drop\s+(?:database|table)|truncate\s+table|delete\s+from\s+\S+\s*;?\s*$)/i, reason: "The database operation can remove a large amount of data." },
  { id: "secret-read", decision: "WARN", pattern: /(?:\bcat\b|\btype\b|Get-Content)[^\n]*(?:\.env\b|id_(?:rsa|ed25519)\b|credentials(?:\.json)?\b)/i, reason: "The command reads a commonly sensitive file." },
  { id: "private-key-material", decision: "BLOCK", pattern: /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/i, reason: "Private key material must not be passed through command text." },
  { id: "production-context", decision: "CONFIRM", test: ({ context }) => context === "production", reason: "Production context requires an explicit confirmation boundary." }
];

const rank = { ALLOW: 0, WARN: 1, CONFIRM: 2, BLOCK: 3 };

export function evaluate(input) {
  const command = String(input?.command ?? "").trim();
  const context = String(input?.context ?? "local").toLowerCase();
  const matches = rules.filter((rule) => rule.pattern?.test(command) || rule.test?.({ command, context }));
  const decision = matches.reduce((current, rule) => rank[rule.decision] > rank[current] ? rule.decision : current, "ALLOW");
  return {
    decision,
    summary: decision === "ALLOW" ? "No configured risk rule matched." : `${matches.length} policy rule${matches.length === 1 ? "" : "s"} matched.`,
    reasons: matches.map((rule) => rule.reason),
    ruleIds: matches.map((rule) => rule.id),
    context,
    auditedAt: new Date().toISOString()
  };
}
