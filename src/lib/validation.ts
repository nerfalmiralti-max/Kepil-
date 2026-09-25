import { z } from "zod";
import sharp from "sharp";
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const defectSchema = z.object({
  aid: z.uuid(),
  cat: z.enum(["WATER_LEAK", "LIGHTING", "SURFACE", "EQUIPMENT", "OTHER"]),
  sev: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  heading: z.string().trim().min(3).max(150),
  description_text: z.string().trim().min(10).max(5000),
  rid: z.uuid(),
});
export async function validatePhoto(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) return false;
  const allowed: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/webp": "webp",
  };
  if (!allowed[mime]) return false;
  try {
    const image = sharp(bytes, {
      limitInputPixels: 25_000_000,
      failOn: "error",
    });
    const metadata = await image.metadata();
    if (
      metadata.format !== allowed[mime] ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) > 1
    )
      return false;
    await image.stats(); // Decode, rather than accepting a forged/truncated header.
    return true;
  } catch {
    return false;
  }
}
export function friendlyError(message: string) {
  const mappings: [RegExp, string][] = [
    [
      /New upload required/,
      "После возврата на доработку загрузите новую фотографию выполненных работ.",
    ],
    [/Invalid login credentials/, "Неверный email или пароль."],
    [
      /Permission denied|permission denied/,
      "У вашей учётной записи нет доступа к этому действию.",
    ],
    [
      /Invalid state transition/,
      "Статус заявки изменился. Обновите страницу и повторите действие.",
    ],
    [
      /evidence required/,
      "Добавьте фото результата ремонта. После отклонения требуется новое фото.",
    ],
    [/overlap/, "Сроки пересекаются с существующей гарантией."],
    [/duplicate key/, "Запись с таким номером уже существует."],
    [
      /date|check constraint|does not match/,
      "Проверьте даты, подрядчика и связь с договором.",
    ],
    [
      /Cannot change|Cannot reassign/,
      "Эта связь уже используется в истории. Создайте новую запись.",
    ],
    [/Authentication|JWT/, "Сессия истекла. Войдите снова."],
  ];
  return (
    mappings.find(([pattern]) => pattern.test(message))?.[1] ??
    "Не удалось сохранить данные. Проверьте поля и соединение, затем повторите попытку."
  );
}
