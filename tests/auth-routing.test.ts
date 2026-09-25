import assert from "node:assert/strict";
import test from "node:test";
import { defaultWorkspace, safeWorkspacePath } from "../src/lib/auth-routing";

test("OAuth return paths stay inside the workspace", () => {
  assert.equal(
    safeWorkspacePath("/claims/123?tab=history"),
    "/claims/123?tab=history",
  );
  for (const value of [
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/%2fexample.com",
    "/%5cexample.com",
    "/login",
    "/auth/callback",
    "/access-pending",
    "/setup",
    "",
    null,
  ])
    assert.equal(safeWorkspacePath(value), null);
});

test("OAuth landing respects the database role", () => {
  assert.equal(defaultWorkspace("ADMIN"), "/");
  assert.equal(defaultWorkspace("INSPECTOR"), "/inspector");
  assert.equal(defaultWorkspace("CONTRACTOR"), "/contractor");
  assert.equal(defaultWorkspace("USER"), "/account");
});
