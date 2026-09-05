# Bastion

Local policy guard for risky AI coding agent operations.

**Open source by [Whistler Digital](https://whistler.com.tr/).**

Bastion evaluates a command before execution and returns one deterministic decision: `ALLOW`, `WARN`, `CONFIRM`, or `BLOCK`. It runs locally and sends no command or project data to an external service.

## Quick start

```bash
npx @whistler-digital/bastion --json -- "git push --force origin main"
```

```json
{
  "decision": "CONFIRM",
  "summary": "1 policy rule matched.",
  "reasons": ["Force push can rewrite shared history."],
  "ruleIds": ["git-force-push"],
  "context": "local"
}
```

Use `--context production` to require a confirmation boundary for production operations. Exit codes are `0` allow, `2` warn, `3` confirm, and `4` block.

## Security boundary

Bastion is a policy preflight tool. It is not an operating-system sandbox, antivirus product, permission manager, or complete prompt-injection defense. A blocked decision does not stop a separate process unless the caller enforces the exit code.

## Development

```bash
npm test
npm run check
```

## Developed by Whistler Digital

Bastion is designed, developed, and maintained by [Whistler Digital](https://whistler.com.tr/). Security reports: [info@whistler.com.tr](mailto:info@whistler.com.tr).

## License

[MIT](LICENSE)
