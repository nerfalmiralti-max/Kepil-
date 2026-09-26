import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { RoleAssignmentForm } from "@/components/role-assignment-form";
import { date, roleNames } from "@/lib/labels";
import type { Profile } from "@/lib/types";

export default async function AdminUsersPage() {
  const actor = await getProfile();
  if (actor.role !== "ADMIN")
    redirect(actor.role === "USER" ? "/account" : "/");
  const db = await createClient();
  const users: Profile[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 999);
    if (error)
      throw new Error(`Не удалось загрузить пользователей: ${error.message}`);
    users.push(...(data as Profile[]));
    if (data.length < 1000) break;
  }
  const { data: organizations, error } = await db
    .from("organizations")
    .select("id,name,type")
    .order("name");
  if (error)
    throw new Error(`Не удалось загрузить организации: ${error.message}`);
  const orgNames = new Map(organizations.map((org) => [org.id, org.name]));
  return (
    <>
      <PageHeader
        eyebrow="АДМИНИСТРИРОВАНИЕ"
        title="Пользователи"
        description="Назначайте роли и организацию. Каждое изменение фиксируется в журнале."
      />
      <p className="users-count">Всего пользователей: {users.length}</p>
      <div className="users-list">
        <div className="users-heading" aria-hidden="true">
          <span>Имя</span>
          <span>Email</span>
          <span>Роль</span>
          <span>Организация</span>
          <span>Добавлен</span>
        </div>
        {users.map((user) => (
          <section className="panel user-row" key={user.id}>
            <div className="user-summary">
              <div>
                <h2>{user.full_name}</h2>
              </div>
              <div>
                <span>{user.email}</span>
              </div>
              <div>
                <strong>{roleNames[user.role]}</strong>
              </div>
              <div>
                <strong>
                  {user.organization_id
                    ? (orgNames.get(user.organization_id) ?? "—")
                    : "Не назначена"}
                </strong>
              </div>
              <div>
                <strong>{date(user.created_at)}</strong>
              </div>
            </div>
            {user.id === actor.id ? (
              <p className="small muted">
                Вашу роль нельзя изменить в этом разделе.
              </p>
            ) : (
              <RoleAssignmentForm
                userId={user.id}
                role={user.role}
                organizationId={user.organization_id}
                organizations={organizations}
              />
            )}
          </section>
        ))}
      </div>
    </>
  );
}
