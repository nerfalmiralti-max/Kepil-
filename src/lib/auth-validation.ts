import { z } from "zod";

type Credentials = { email: string; password: string };
type Validation =
  { data: Credentials; error?: never } | { data?: never; error: string };
type Registration =
  | { data: Credentials & { fullName: string }; error?: never }
  | { data?: never; error: string };

export function validateLogin(rawEmail: string, password: string): Validation {
  const email = rawEmail.trim().toLowerCase();
  if (!z.email().safeParse(email).success || !password || password.length > 256)
    return { error: "Введите корректный email и пароль." };
  return { data: { email, password } };
}

export function validateRegistration(
  rawEmail: string,
  password: string,
  repeatPassword: string,
  rawFullName: string,
): Registration {
  const email = rawEmail.trim().toLowerCase();
  const fullName = rawFullName.trim().replace(/\s+/g, " ");
  if (
    !fullName ||
    fullName.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(fullName)
  )
    return { error: "Введите имя (до 200 символов)." };
  if (
    email.length > 254 ||
    !z.email().safeParse(email).success ||
    !email.endsWith("@gmail.com")
  )
    return { error: "Введите адрес @gmail.com." };
  if (password.length < 8)
    return { error: "Пароль должен содержать минимум 8 символов." };
  if (password.length > 256) return { error: "Пароль слишком длинный." };
  if (password !== repeatPassword) return { error: "Пароли не совпадают." };
  return { data: { email, password, fullName } };
}
