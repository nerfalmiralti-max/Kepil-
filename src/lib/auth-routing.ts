import type { Role } from "./types";

export function defaultWorkspace(role: Role): string {
  if (role === "CONTRACTOR") return "/contractor";
  if (role === "INSPECTOR") return "/inspector";
  return "/";
}

export function safeWorkspacePath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f]/.test(value) || /%(?:2f|5c|00)/i.test(value))
    return null;
  const path = value.split(/[?#]/, 1)[0];
  if (/^\/(?:auth|login|access-pending|setup)(?:\/|$)/.test(path)) return null;
  return value;
}
