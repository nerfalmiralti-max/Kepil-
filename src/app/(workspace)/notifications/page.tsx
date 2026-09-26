import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { getDataset } from "@/lib/data";
import { PageHeader, Empty } from "@/components/ui";
import { readNotificationsAction } from "@/app/actions";
import { date } from "@/lib/labels";
export default async function NotificationsPage() {
  const d = await getDataset();
  return (
    <>
      <PageHeader
        title="Уведомления"
        description="Назначения и изменения по доступным вам гарантийным заявкам."
        action={
          d.notifications.some((n) => !n.read_at) ? (
            <form action={readNotificationsAction}>
              <button className="button secondary">
                <CheckCheck size={17} />
                Отметить прочитанными
              </button>
            </form>
          ) : undefined
        }
      />
      <section className="panel">
        {d.notifications.length ? (
          <div className="notification-list">
            {d.notifications.map((n) => (
              <article key={n.id} className={n.read_at ? "read" : "unread"}>
                <Bell size={19} />
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <time>{date(n.created_at, true)}</time>
                </div>
                {n.claim_id && (
                  <Link className="text-link" href={`/claims/${n.claim_id}`}>
                    Открыть заявку
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Новых событий пока нет" />
        )}
      </section>
    </>
  );
}
