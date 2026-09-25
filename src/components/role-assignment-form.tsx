"use client";
import { useActionState, useState } from "react";
import { assignUserRoleAction } from "@/app/actions";
import type { ActionState, Role } from "@/lib/types";

type Organization = { id: string; name: string; type: string };
export function RoleAssignmentForm({
  userId,
  role,
  organizationId,
  organizations,
}: {
  userId: string;
  role: Role;
  organizationId: string | null;
  organizations: Organization[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    assignUserRoleAction,
    {},
  );
  const [selectedRole, setSelectedRole] = useState<Role>(role);
  const options = organizations.filter((org) =>
    selectedRole === "CONTRACTOR"
      ? org.type === "CONTRACTOR"
      : org.type !== "CONTRACTOR",
  );
  return (
    <form action={action} className="role-form">
      <input type="hidden" name="target_user" value={userId} />
      {selectedRole === "USER" && (
        <input type="hidden" name="target_org" value="" />
      )}
      <label>
        Роль
        <select
          name="target_role"
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value as Role)}
        >
          <option value="USER">Пользователь</option>
          <option value="INSPECTOR">Инспектор</option>
          <option value="CONTRACTOR">Подрядчик</option>
          <option value="ADMIN">Администратор</option>
        </select>
      </label>
      <label>
        Организация
        <select
          name="target_org"
          key={selectedRole}
          defaultValue={selectedRole === role ? (organizationId ?? "") : ""}
          disabled={selectedRole === "USER"}
          required={selectedRole !== "USER"}
        >
          <option value="">
            {selectedRole === "USER" ? "Не назначена" : "Выберите организацию"}
          </option>
          {options.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </label>
      <button className="button secondary" disabled={pending}>
        {pending ? "Сохранение…" : "Сохранить"}
      </button>
      {state.error && (
        <span className="role-feedback error" role="alert">
          {state.error}
        </span>
      )}
      {state.success && (
        <span className="role-feedback" role="status">
          {state.success}
        </span>
      )}
    </form>
  );
}
