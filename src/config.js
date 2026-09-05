import { readFile } from "node:fs/promises";
import path from "node:path";
export async function loadConfig(filename = ".bastion.json", cwd = process.cwd()) { const resolved = path.resolve(cwd, filename); try { const parsed = JSON.parse(await readFile(resolved, "utf8")); if (parsed.rules && !Array.isArray(parsed.rules)) throw new TypeError("rules must be an array"); return { ...parsed, configPath: resolved }; } catch (error) { if (error?.code === "ENOENT") return { configPath: null }; throw new Error(`Invalid Bastion config: ${error.message}`); } }
