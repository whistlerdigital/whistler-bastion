const sensitivePath = /(?:^|[\\/\s"'])(?:\.env(?:\..*)?|\.ssh[\\/]|id_(?:rsa|ed25519)|credentials(?:\.json)?|secrets?\.(?:json|ya?ml)|\.aws[\\/]credentials)(?:$|[\s"'])/i;
export const builtinRules = Object.freeze([
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
