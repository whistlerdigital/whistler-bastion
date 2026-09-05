import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
export async function appendAudit(result, filename) { if (!filename) return; const target = path.resolve(filename); await mkdir(path.dirname(target), { recursive: true }); await appendFile(target, `${JSON.stringify(result)}\n`, { encoding: "utf8", mode: 0o600 }); }
