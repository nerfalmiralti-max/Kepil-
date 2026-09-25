"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Upload,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  loginAction,
  submitDefectAction,
  transitionAction,
  uploadAction,
  saveRegistryAction,
} from "@/app/actions";
import type { ActionState, Asset, Dataset, Claim, Role } from "@/lib/types";
import {
  categories,
  date,
  claimCode,
  statuses,
  assetTypes,
} from "@/lib/labels";
const initial: ActionState = {};
function Feedback({ state }: { state: ActionState }) {
  return (
    <>
      {state.error && (
        <div className="notice danger" role="alert">
          <AlertTriangle size={18} />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="notice success" role="status">
          <CheckCircle2 size={18} />
          {state.success}
        </div>
      )}
    </>
  );
}
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="login-methods">
      <a className="button google-button full" href="/auth/google">
        <svg aria-hidden="true" width="19" height="19" viewBox="0 0 48 48">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.68 46.98 24.55z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.12.76-4.59l-7.98-6.2A23.85 23.85 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        Продолжить с Google
      </a>
      <div className="login-divider">
        <span>или войти по email</span>
      </div>
      <form action={action} className="form-stack">
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            placeholder="inspector@kepil.demo"
          />
        </label>
        <label>
          Пароль
          <span className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        <Feedback state={state} />
        <button className="button primary full" disabled={pending}>
          {pending ? "Вход…" : "Войти в рабочее пространство"}
          <ArrowRight size={17} />
        </button>
        <p className="small muted">
          <LockKeyhole size={13} /> Доступ по учётной записи вашей организации
        </p>
      </form>
    </div>
  );
}
export function DefectForm({
  assets,
  selectedId,
  requestId,
}: {
  assets: Asset[];
  selectedId?: string;
  requestId: string;
}) {
  const [state, action, pending] = useActionState(submitDefectAction, initial);
  if (state.result) {
    const r = state.result;
    return (
      <div className="result-stack">
        <section
          className={`panel result-panel ${r.warrantyStatus === "ACTIVE" ? "matched" : ""}`}
        >
          <div className="result-icon">
            <CheckCircle2 size={32} />
          </div>
          <div className="eyebrow">ДЕФЕКТ СОХРАНЁН</div>
          <h2>
            {r.warrantyStatus === "ACTIVE"
              ? "Гарантия найдена"
              : r.warrantyStatus === "EXPIRED"
                ? "Гарантийный срок истёк"
                : "Действующая гарантия не найдена"}
          </h2>
          {r.claimId ? (
            <>
              <p>
                Заявка автоматически создана и направлена ответственному
                подрядчику.
              </p>
              <div className="result-grid">
                <div>
                  <span>Гарантия до</span>
                  <strong>{date(r.expiresAt)}</strong>
                </div>
                <div>
                  <span>Осталось</span>
                  <strong>{r.remainingWarrantyDays} дней</strong>
                </div>
                <div>
                  <span>Ответственный подрядчик</span>
                  <strong>{r.contractor?.name}</strong>
                </div>
                <div>
                  <span>Гарантийная заявка</span>
                  <strong>{claimCode(r.claimNumber!)}</strong>
                </div>
              </div>
              <Link className="button primary" href={`/claims/${r.claimId}`}>
                Открыть заявку
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <p>
                Дефект зарегистрирован в истории объекта. Автоматическая
                гарантийная заявка не создана: требуется решение муниципальной
                службы.
              </p>
              <Link className="button secondary" href="/assets">
                К объектам
              </Link>
            </>
          )}
        </section>
        {r.repeatDefect && (
          <div className="notice warning repeat-result">
            <AlertTriangle size={25} />
            <div>
              <h3>Повторный дефект обнаружен</h3>
              <p>
                {r.repeatCount}-е обращение в пределах 90 дней. С предыдущего
                дефекта: {r.daysSincePreviousDefect} дн.
              </p>
              <p className="small">
                Сопоставление по объекту и категории, на основе истории базы
                данных.
              </p>
            </div>
          </div>
        )}
        <a className="text-link" href="/defects/new">
          Зарегистрировать следующий дефект
          <ArrowRight size={15} />
        </a>
      </div>
    );
  }
  return (
    <form action={action} className="panel form-stack">
      <input type="hidden" name="rid" value={requestId} />
      <div className="form-section-label">Объект и характер повреждения</div>
      <label>
        Объект инфраструктуры
        <select name="aid" required defaultValue={selectedId ?? ""}>
          <option value="" disabled>
            Выберите объект
          </option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.asset_code} · {a.name} · {a.microdistrict} мкр.
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Категория дефекта
          <select name="cat" defaultValue="WATER_LEAK">
            {Object.entries(categories).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Критичность
          <select name="sev" defaultValue="HIGH">
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
              <option key={s} value={s}>
                {statuses[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Краткое описание
        <input
          name="heading"
          placeholder="Например, утечка трубы у дома № 18"
          minLength={3}
          maxLength={150}
          required
        />
      </label>
      <label>
        Что произошло
        <textarea
          name="description_text"
          rows={5}
          placeholder="Укажите точное место, характер повреждения и обстоятельства обнаружения."
          minLength={10}
          maxLength={5000}
          required
        />
      </label>
      <Feedback state={state} />
      <div className="form-footer">
        <p>
          После сохранения KEPIL проверит гарантию, подрядчика и предыдущие
          дефекты.
        </p>
        <button
          className="button primary"
          disabled={pending || assets.length === 0}
        >
          {pending ? "Проверка гарантии…" : "Зарегистрировать дефект"}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
export function ClaimActions({ claim, role }: { claim: Claim; role: Role }) {
  const [state, action, pending] = useActionState(transitionAction, initial);
  const rejectDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (state.success) rejectDialog.current?.close();
  }, [state.success]);
  const contractor = role === "ADMIN" || role === "CONTRACTOR";
  const inspector = role === "ADMIN" || role === "INSPECTOR";
  const next =
    claim.status === "OPEN"
      ? "ACKNOWLEDGED"
      : ["ACKNOWLEDGED", "REJECTED"].includes(claim.status)
        ? "IN_PROGRESS"
        : claim.status === "IN_PROGRESS"
          ? "REPAIR_SUBMITTED"
          : null;
  const captions: Record<string, string> = {
    ACKNOWLEDGED: "Принять заявку",
    IN_PROGRESS:
      claim.status === "REJECTED" ? "Начать доработку" : "Начать ремонт",
    REPAIR_SUBMITTED: "Отправить на проверку",
  };
  if (claim.status === "VERIFIED")
    return (
      <div className="notice success">
        <CheckCircle2 size={20} />
        <div>
          <strong>Ремонт принят инспектором</strong>
          <p>Гарантийная заявка закрыта. История и подтверждения сохранены.</p>
        </div>
      </div>
    );
  if (
    !(contractor && next) &&
    !(inspector && claim.status === "REPAIR_SUBMITTED")
  )
    return (
      <div className="notice info">
        {claim.status === "REPAIR_SUBMITTED"
          ? "Ожидается решение инспектора. Подрядчик не может подтвердить собственный ремонт."
          : "Заявка находится на стороне подрядчика. Приёмка станет доступна после отправки результата ремонта."}
      </div>
    );
  return (
    <section className="panel action-panel">
      <h2>
        {claim.status === "REPAIR_SUBMITTED"
          ? "Решение инспектора"
          : "Следующее действие"}
      </h2>
      <p className="muted">
        {claim.status === "REPAIR_SUBMITTED"
          ? "Проверьте фотографии и результат работ. Для возврата на доработку укажите причину."
          : "Изменение статуса сохранится в истории заявки."}
      </p>
      <form action={action} className="form-stack">
        <input type="hidden" name="cid" value={claim.id} />
        <label>
          Комментарий
          {claim.status === "REPAIR_SUBMITTED" && (
            <span className="muted small">
              Обязателен при возврате на доработку
            </span>
          )}
          <textarea
            name="comment_text"
            rows={3}
            maxLength={3000}
            placeholder="Результат осмотра или примечание к работам"
          />
        </label>
        <Feedback state={state} />
        <div className="button-row">
          {contractor && next && (
            <button
              name="target"
              value={next}
              className="button primary"
              disabled={pending}
            >
              {pending ? "Сохранение…" : captions[next]}
              <ArrowRight size={16} />
            </button>
          )}
          {inspector && claim.status === "REPAIR_SUBMITTED" && (
            <>
              <button
                name="target"
                value="VERIFIED"
                className="button primary"
                disabled={pending}
              >
                <CheckCircle2 size={17} />
                Принять ремонт
              </button>
              <button
                type="button"
                className="button danger-outline"
                disabled={pending}
                onClick={() => rejectDialog.current?.showModal()}
              >
                Вернуть на доработку
              </button>
            </>
          )}
        </div>
      </form>
      {inspector && claim.status === "REPAIR_SUBMITTED" && (
        <dialog
          ref={rejectDialog}
          className="decision-dialog"
          aria-labelledby="reject-title"
        >
          <div className="decision-dialog-head">
            <div className="eyebrow">РЕШЕНИЕ ИНСПЕКТОРА</div>
            <h2 id="reject-title">Вернуть ремонт на доработку?</h2>
            <p>Подрядчик увидит причину возврата в истории заявки.</p>
          </div>
          <form action={action} className="form-stack">
            <input type="hidden" name="cid" value={claim.id} />
            <input type="hidden" name="target" value="REJECTED" />
            <label>
              Причина возврата
              <textarea
                name="comment_text"
                rows={4}
                minLength={5}
                maxLength={3000}
                required
                placeholder="Опишите, что необходимо исправить"
              />
            </label>
            <Feedback state={state} />
            <div className="button-row">
              <button
                type="submit"
                className="button danger-outline"
                disabled={pending}
              >
                {pending ? "Сохранение…" : "Вернуть на доработку"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => rejectDialog.current?.close()}
              >
                Отмена
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
}
export function UploadForm({ claimId }: { claimId: string }) {
  const [state, action, pending] = useActionState(uploadAction, initial);
  return (
    <form action={action} className="upload-form form-stack">
      <input type="hidden" name="cid" value={claimId} />
      <div className="form-grid">
        <label>
          Фотография
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
          <span className="small muted">
            JPEG, PNG или WebP · до 3 МБ · до 25 Мп
          </span>
        </label>
        <label>
          Тип подтверждения
          <select name="kind" defaultValue="AFTER">
            <option value="AFTER">После ремонта</option>
            <option value="BEFORE">До ремонта</option>
          </select>
        </label>
      </div>
      <label>
        Что выполнено
        <input
          name="note"
          maxLength={2000}
          placeholder="Заменён повреждённый участок трубы"
        />
      </label>
      <Feedback state={state} />
      <button disabled={pending} className="button secondary">
        {pending ? (
          "Загрузка фотографии…"
        ) : (
          <>
            <Upload size={16} />
            Сохранить фотографию
          </>
        )}
      </button>
    </form>
  );
}

export function RegistryForm({
  data,
  kind,
  record,
}: {
  data: Pick<Dataset, "assets" | "contracts" | "contractors">;
  kind: string;
  record?: Record<string, string | number | null>;
}) {
  const [state, action, pending] = useActionState(saveRegistryAction, initial);
  const [selectedAsset, setSelectedAsset] = useState(
    String(record?.asset_id ?? ""),
  );
  const selectedContractor = data.contracts.find(
    (c) =>
      c.id === data.assets.find((a) => a.id === selectedAsset)?.contract_id,
  )?.contractor_id;
  const input = (
    name: string,
    label: string,
    type = "text",
    required = true,
  ) => (
    <label key={name}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={String(record?.[name] ?? "")}
        maxLength={5000}
      />
    </label>
  );
  const select = (
    name: string,
    label: string,
    options: { id: string; name: string }[],
  ) => (
    <label key={name}>
      {label}
      <select name={name} required defaultValue={String(record?.[name] ?? "")}>
        <option value="" disabled>
          Выберите
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="_kind" value={kind} />
      <input type="hidden" name="_id" value={String(record?.id ?? "")} />
      <div className="form-grid">
        {kind === "contractors" && (
          <>
            {input("name", "Название организации")}
            {input(
              "bin_or_demo_identifier",
              "БИН / демонстрационный идентификатор",
            )}
            {input("contact_name", "Контактное лицо", "text", false)}
            {input("contact_phone", "Телефон", "tel", false)}
          </>
        )}
        {kind === "contracts" && (
          <>
            {input("contract_number", "Номер договора")}
            {input("title", "Предмет договора")}
            {select("contractor_id", "Подрядчик", data.contractors)}
            {input("start_date", "Дата начала", "date")}
            {input("completion_date", "Дата завершения", "date")}
            {input("description", "Описание", "text", false)}
          </>
        )}
        {kind === "assets" && (
          <>
            {input("name", "Название объекта")}
            {input("asset_code", "Инвентарный код")}
            {select(
              "asset_type",
              "Тип объекта",
              Object.entries(assetTypes).map(([id, name]) => ({ id, name })),
            )}
            {input("microdistrict", "Микрорайон")}
            {input("address", "Адрес")}
            {select(
              "contract_id",
              "Договор",
              data.contracts.map((c) => ({
                id: c.id,
                name: `${c.contract_number} · ${c.title}`,
              })),
            )}
            {input("commissioned_at", "Дата ввода в эксплуатацию", "date")}
            {input("description", "Описание", "text", false)}
            {input("latitude", "Широта", "text", false)}
            {input("longitude", "Долгота", "text", false)}
          </>
        )}
        {kind === "warranties" && (
          <>
            <label>
              Объект
              <select
                name="asset_id"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                required
              >
                <option value="" disabled>
                  Выберите объект
                </option>
                {data.assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.asset_code} · {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Подрядчик по договору
              <input
                readOnly
                value={
                  data.contractors.find((c) => c.id === selectedContractor)
                    ?.name ?? "Выберите объект"
                }
              />
              <input
                type="hidden"
                name="contractor_id"
                value={selectedContractor ?? ""}
              />
            </label>
            {input("starts_at", "Начало гарантии", "date")}
            {input("expires_at", "Окончание гарантии", "date")}
            {input("terms", "Условия гарантии")}
          </>
        )}
      </div>
      <Feedback state={state} />
      <button className="button primary" disabled={pending}>
        {pending
          ? "Сохранение…"
          : record
            ? "Сохранить изменения"
            : "Добавить запись"}
      </button>
    </form>
  );
}
