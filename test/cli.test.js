import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cli = path.resolve("bin/bastion.js");
const run = (cwd, args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });

test("CLI setup lifecycle works end to end", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "bastion-cli-"));
  try {
    assert.equal(run(cwd, ["init"]).status, 0);
    assert.equal(run(cwd, ["connect", "cursor"]).status, 0);
    assert.equal(run(cwd, ["doctor", "--json"]).status, 0);
    assert.equal(run(cwd, ["disconnect", "cursor"]).status, 0);
    assert.equal(run(cwd, ["restore", "cursor"]).status, 0);
    assert.match(await readFile(path.join(cwd, ".cursor/mcp.json"), "utf8"), /whistler-bastion/);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
