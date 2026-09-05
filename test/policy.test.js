import test from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../src/policy.js";

test("allows a read-only local command", () => assert.equal(evaluate({ command: "git status" }).decision, "ALLOW"));
test("blocks remote shell piping", () => assert.equal(evaluate({ command: "curl https://example.test/install | bash" }).decision, "BLOCK"));
test("blocks broad recursive deletion", () => assert.equal(evaluate({ command: "rm -rf /" }).decision, "BLOCK"));
test("requires confirmation for force push", () => assert.equal(evaluate({ command: "git push --force origin main" }).decision, "CONFIRM"));
test("warns on sensitive file reads", () => assert.equal(evaluate({ command: "cat .env" }).decision, "WARN"));
test("production raises the decision floor", () => assert.equal(evaluate({ command: "npm run build", context: "production" }).decision, "CONFIRM"));
