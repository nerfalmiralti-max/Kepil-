"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Wrench,
  ClipboardCheck,
  Network,
  Settings2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import type { Profile } from "@/lib/types";
import { roleNames } from "@/lib/labels";
import { logoutAction } from "@/app/actions";

export function Navigation({
  profile,
  organizationName,
}: {
  profile: Profile;
  organizationName: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links =
    profile.role === "USER"
      ? [{ href: "/account", label: "Мой аккаунт", icon: UserRound }]
      : profile.role === "CONTRACTOR"
        ? [
            { href: "/contractor", label: "Мои заявки", icon: Wrench },
            { href: "/assets", label: "Объекты", icon: Building2 },
          ]
        : [
            { href: "/", label: "Обзор города", icon: LayoutDashboard },
            { href: "/assets", label: "Объекты", icon: Building2 },
            {
              href: "/claims",
              label: "Гарантийные заявки",
              icon: ClipboardList,
            },
            {
              href: "/inspector",
              label: "Приёмка работ",
              icon: ClipboardCheck,
            },
            ...(profile.role === "ADMIN"
              ? [
                  {
                    href: "/admin/users",
                    label: "Пользователи",
                    icon: UsersRound,
                  },
                  {
                    href: "/registry",
                    label: "Управление реестром",
                    icon: Settings2,
                  },
                ]
              : []),
          ];
  return (
    <>
      <button
        className="mobile-menu icon-button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <button
          className="nav-scrim"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link
          href={
            profile.role === "USER"
              ? "/account"
              : profile.role === "CONTRACTOR"
                ? "/contractor"
                : "/"
          }
          className="brand"
          onClick={() => setOpen(false)}
        >
          <span className="brand-mark">
            <ShieldCheck size={25} />
          </span>
          <span>
            KEPIL<small>ГОРОД НА ГАРАНТИИ</small>
          </span>
        </Link>
        <div className="city-label">
          <MapPin size={14} /> Актау <span>Мангистауская область</span>
        </div>
        <div className="nav-caption">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav aria-label="Основная навигация">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={
                (href === "/" ? path === "/" : path.startsWith(href))
                  ? "active"
                  : ""
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav-bottom">
          <nav aria-label="Дополнительно">
            {profile.role !== "USER" && (
              <Link
                href="/notifications"
                className={path === "/notifications" ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <Bell size={18} />
                Уведомления
              </Link>
            )}
            <Link
              href="/system"
              className={path === "/system" ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              <Network size={18} />
              Как работает KEPIL
            </Link>
          </nav>
          <div className="sidebar-demo">
            <span className="live-dot" />
            Демонстрационный проект<small>Сценарии инфраструктуры Актау</small>
          </div>
          <div className="account">
            <span className="avatar">
              {profile.full_name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </span>
            <div>
              <strong>{profile.full_name}</strong>
              <small>{roleNames[profile.role]}</small>
              <small className="account-organization" title={organizationName}>
                {organizationName}
              </small>
            </div>
            <form action={logoutAction}>
              <button
                className="icon-button"
                aria-label="Выйти из аккаунта"
                title="Выйти"
              >
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
