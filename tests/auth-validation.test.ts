import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateLogin,
  validateRegistration,
} from "../src/lib/auth-validation";

test("registration accepts a Gmail address and a matching KEPIL password", () => {
  assert.deepEqual(
    validateRegistration(
      " Name+test@GMAIL.COM ",
      "kepilPass8",
      "kepilPass8",
      "  Алия   Сагындыкова ",
    ),
    {
      data: {
        email: "name+test@gmail.com",
        password: "kepilPass8",
        fullName: "Алия Сагындыкова",
      },
    },
  );
});

test("registration rejects other addresses, short and mismatched passwords", () => {
  assert.equal(
    validateRegistration("name@example.com", "kepilPass8", "kepilPass8", "Алия")
      .error,
    "Введите адрес @gmail.com.",
  );
  assert.equal(
    validateRegistration("name@gmail.com", "short", "short", "Алия").error,
    "Пароль должен содержать минимум 8 символов.",
  );
  assert.equal(
    validateRegistration("name@gmail.com", "kepilPass8", "different8", "Алия")
      .error,
    "Пароли не совпадают.",
  );
  assert.equal(
    validateRegistration("name@gmail.com", "kepilPass8", "kepilPass8", "")
      .error,
    "Введите имя (до 200 символов).",
  );
});

test("login preserves existing non-Gmail staff accounts", () => {
  assert.deepEqual(validateLogin(" admin@kepil.demo ", "password123"), {
    data: { email: "admin@kepil.demo", password: "password123" },
  });
});
