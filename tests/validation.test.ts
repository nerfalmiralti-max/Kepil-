import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePhoto, defectSchema } from "../src/lib/validation";
test("rejects renamed executables and oversized uploads", async () => {
  assert.equal(
    await validatePhoto(new Uint8Array([77, 90, 0, 0]), "image/png"),
    false,
  );
  assert.equal(
    await validatePhoto(new Uint8Array(3145729), "image/png"),
    false,
  );
  assert.equal(
    await validatePhoto(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
    false,
  );
  assert.equal(
    await validatePhoto(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/jpeg",
    ),
    false,
  );
});
test("validates UUIDs, enum values and minimum description server side", () => {
  const input = {
    aid: crypto.randomUUID(),
    cat: "WATER_LEAK",
    sev: "HIGH",
    heading: "Утечка трубы",
    description_text: "На соединении обнаружена утечка воды.",
    rid: crypto.randomUUID(),
  };
  assert.equal(defectSchema.safeParse(input).success, true);
  for (const change of [
    { aid: "1" },
    { cat: "arbitrary" },
    { sev: "ADMIN" },
    { description_text: "  " },
    { heading: "x" },
  ])
    assert.equal(
      defectSchema.safeParse({ ...input, ...change }).success,
      false,
    );
});
