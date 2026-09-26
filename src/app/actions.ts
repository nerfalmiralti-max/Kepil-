"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { defaultWorkspace } from "@/lib/auth-routing";
import { validateLogin, validateRegistration } from "@/lib/auth-validation";
import {
  defectSchema,
  friendlyError,
  validatePhoto,
  MAX_PHOTO_BYTES,
} from "@/lib/validation";
import type { ActionState, DefectResult } from "@/lib/types";

export async function loginAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const input = validateLogin(
    String(form.get("email") ?? ""),
    String(form.get("password") ?? ""),
  );
  if (!input.data) return { error: input.error };
  try {
    const db = await createClient();
    const { error } = await db.auth.signInWithPassword(input.data);
    if (error)
      return {
        error:
          error.code === "email_not_confirmed"
            ? "Подтвердите email по ссылке из письма и повторите вход."
            : "Неверный email или пароль.",
      };
  } catch {
    return { error: "Сервис входа недоступен. Повторите попытку позже." };
  }
  const profile = await getProfile();
  redirect(defaultWorkspace(profile.role));
}

export async function registerAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const input = validateRegistration(
    String(form.get("email") ?? ""),
    String(form.get("password") ?? ""),
    String(form.get("repeat_password") ?? ""),
  );
  if (!input.data) return { error: input.error };
  try {
    const db = await createClient();
    const { data, error } = await db.auth.signUp(input.data);
    if (error) {
      if (error.code === "user_already_exists")
        return { error: "Этот email уже зарегистрирован." };
      if (error.code === "weak_password")
        return {
          error:
            "Пароль не соответствует требованиям безопасности. Выберите другой пароль.",
        };
      if (error.code === "over_email_send_rate_limit")
        return {
          error: "Отправка писем временно ограничена. Повторите попытку позже.",
        };
      return { error: "Не удалось создать аккаунт. Повторите попытку позже." };
    }
    if (!data.session)
      return {
        success:
          "Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите.",
      };
  } catch {
    return { error: "Сервис регистрации недоступен. Повторите попытку позже." };
  }
  const profile = await getProfile();
  redirect(defaultWorkspace(profile.role));
}

export async function requestPasswordResetAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!z.email().safeParse(email).success)
    return { error: "Введите корректный email." };
  try {
    const db = await createClient();
    const site =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://kepil.vercel.app";
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/auth/callback?next=/reset-password`,
    });
    if (error?.code === "over_email_send_rate_limit")
      return {
        error: "Отправка писем временно ограничена. Повторите попытку позже.",
      };
    if (error)
      return { error: "Не удалось отправить письмо. Повторите попытку позже." };
  } catch {
    return {
      error: "Сервис восстановления недоступен. Повторите попытку позже.",
    };
  }
  return {
    success:
      "Если аккаунт существует, письмо со ссылкой для смены пароля отправлено.",
  };
}

export async function updatePasswordAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const password = String(form.get("password") ?? "");
  const repeat = String(form.get("repeat_password") ?? "");
  if (password.length < 8)
    return { error: "Пароль должен содержать минимум 8 символов." };
  if (password.length > 256) return { error: "Пароль слишком длинный." };
  if (password !== repeat) return { error: "Пароли не совпадают." };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "Ссылка устарела. Запросите новое письмо." };
  const { error } = await db.auth.updateUser({ password });
  if (error)
    return { error: "Не удалось изменить пароль. Запросите новую ссылку." };
  const profile = await getProfile();
  redirect(defaultWorkspace(profile.role));
}
export async function logoutAction() {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/login");
}

export async function assignUserRoleAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const actor = await getProfile();
  if (actor.role !== "ADMIN")
    return { error: "Доступно только администратору." };
  const input = z
    .object({
      target_user: z.uuid(),
      target_role: z.enum(["USER", "INSPECTOR", "CONTRACTOR", "ADMIN"]),
      target_org: z.union([z.uuid(), z.literal("")]),
    })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return { error: "Проверьте роль и организацию." };
  const db = await createClient();
  const { error } = await db.rpc("assign_user_role", {
    target_user: input.data.target_user,
    target_role: input.data.target_role,
    target_org: input.data.target_org || null,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/users");
  return { success: "Доступ обновлён и записан в журнал." };
}

export async function submitDefectAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await getProfile();
  if (profile.role !== "ADMIN" && profile.role !== "INSPECTOR")
    return { error: "Дефекты регистрирует инспектор или администратор." };
  const input = defectSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return {
      error:
        "Выберите объект, категорию и критичность. Заголовок: от 3 символов, описание: от 10.",
    };
  const db = await createClient();
  const { data, error } = await db.rpc("submit_defect", input.data);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/", "layout");
  return { result: data as DefectResult };
}
export async function transitionAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await getProfile();
  const parsed = z
    .object({
      cid: z.uuid(),
      target: z.enum([
        "ACKNOWLEDGED",
        "IN_PROGRESS",
        "REPAIR_SUBMITTED",
        "VERIFIED",
        "REJECTED",
      ]),
      comment_text: z.string().max(3000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Проверьте параметры действия." };
  if (
    parsed.data.target === "REJECTED" &&
    parsed.data.comment_text.trim().length < 5
  )
    return { error: "Укажите причину возврата: минимум 5 символов." };
  const db = await createClient();
  const { error } = await db.rpc("transition_claim", parsed.data);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/", "layout");
  return { success: "Статус изменён. Действие записано в журнал." };
}
export async function uploadAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await getProfile();
  if (profile.role !== "ADMIN" && profile.role !== "CONTRACTOR")
    return { error: "Подтверждение ремонта загружает подрядчик." };
  const cid = z.uuid().safeParse(form.get("cid"));
  const file = form.get("file");
  const kind = form.get("kind");
  const note = String(form.get("note") ?? "").trim();
  if (
    !cid.success ||
    !(file instanceof File) ||
    !["BEFORE", "AFTER"].includes(String(kind)) ||
    note.length > 2000
  )
    return { error: "Выберите фотографию и тип подтверждения." };
  if (file.size > MAX_PHOTO_BYTES || file.size === 0)
    return { error: "Размер фото должен быть от 1 байта до 3 МБ." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!(await validatePhoto(bytes, file.type)))
    return {
      error:
        "Разрешены целые изображения JPEG, PNG или WebP до 3 МБ и 25 мегапикселей. Проверьте формат и размер файла.",
    };
  const db = await createClient();
  const extension =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : "webp";
  const path = `${cid.data}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await db.storage
    .from("claim-evidence")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return { error: friendlyError(uploadError.message) };
  const { error } = await db.rpc("record_evidence", {
    cid: cid.data,
    path,
    kind,
    note_text: note,
  });
  if (error) {
    await db.storage.from("claim-evidence").remove([path]);
    return { error: friendlyError(error.message) };
  }
  revalidatePath("/", "layout");
  return {
    success: "Фотография сохранена. Теперь можно отправить ремонт на проверку.",
  };
}
export async function saveRegistryAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = await getProfile();
  if (p.role !== "ADMIN") return { error: "Доступно только администратору." };
  const kind = z
    .enum(["assets", "contractors", "contracts", "warranties"])
    .safeParse(form.get("_kind"));
  const rawId = form.get("_id");
  const eid = rawId ? z.uuid().safeParse(rawId) : null;
  if (!kind.success || (eid && !eid.success))
    return { error: "Некорректная запись." };
  const payload = Object.fromEntries(
    [...form.entries()].filter(
      ([key]) => !key.startsWith("_") && !key.startsWith("$"),
    ),
  );
  const db = await createClient();
  const { error } = await db.rpc("save_registry", {
    kind: kind.data,
    eid: eid?.data ?? null,
    payload,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/", "layout");
  return { success: "Запись сохранена в реестре." };
}
export async function readNotificationsAction() {
  await getProfile();
  const db = await createClient();
  const { error } = await db.rpc("mark_notifications_read");
  if (error) throw new Error("Не удалось отметить уведомления");
  revalidatePath("/", "layout");
}
