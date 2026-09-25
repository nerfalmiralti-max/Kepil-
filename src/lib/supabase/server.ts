import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export async function createClient() {
  if (!configured())
    throw new Error("Supabase не настроен. Заполните переменные окружения.");
  const jar = await cookies();
  return createServerClient(
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            for (const { name, value, options } of values)
              jar.set(name, value, options);
          } catch {
            /* Server Components cannot write; proxy refreshes cookies. */
          }
        },
      },
    },
  );
}
