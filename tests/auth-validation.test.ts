import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateLogin,
  validateRegistration,
} from "../src/lib/auth-validation";

test("registration accepts a Gmail address and a matching KEPIL password", () => {
  assert.deepEqual(
    validateRegistration(" Name+test@GMAIL.COM ", "kepilPass8", "kepilPass8"),
    { data: { email: "name+test@gmail.com", password: "kepilPass8" } },
  );
});

test("registration rejects other addresses, short and mismatched passwords", () => {
  assert.equal(
    validateRegistration("name@example.com", "kepilPass8", "kepilPass8").error,
    "Введите адрес Gmail.",
  );
  assert.equal(
    validateRegistration("name@gmail.com", "short", "short").error,
    "Пароль должен содержать минимум 8 символов.",
  );
  assert.equal(
    validateRegistration("name@gmail.com", "kepilPass8", "different8").error,
    "Пароли не совпадают.",
  );
});

test("login preserves existing non-Gmail staff accounts", () => {
  assert.deepEqual(validateLogin(" admin@kepil.demo ", "password123"), {
    data: { email: "admin@kepil.demo", password: "password123" },
  });
});
