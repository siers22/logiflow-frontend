"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, ChevronRight, ClipboardList, LayoutDashboard, LogOut,
  Menu, Moon, Settings2, Sun, Truck, Users, Warehouse, X,
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "@/lib/UserContext";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { BrandMark } from "./BrandMark";
import styles from "./WorkspaceShell.module.css";

const roleNames: Record<string, string> = {
  admin: "Администратор", manager: "Менеджер", driver: "Водитель",
  client: "Клиент",
};

const pageNames: Record<string, string> = {
  admin: "Обзор", operations: "Операции", client: "Мои заказы",
  driver: "Рейсы", manager: "Диспетчерская",
  orders: "Заказ", drivers: "Водители", vehicles: "Транспорт",
  warehouses: "Склады", managers: "Менеджеры", counterparties: "Контрагенты", documents: "Документы", reports: "Отчёты",
};

type NavItem = { label: string; href: string; icon: typeof Boxes };

function navigation(role: string): NavItem[] {
  if (role === "admin") return [
    { label: "Обзор", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Транспорт", href: "/dashboard/vehicles", icon: Truck },
    { label: "Водители", href: "/dashboard/drivers", icon: Users },
    { label: "Склады", href: "/dashboard/warehouses", icon: Warehouse },
    { label: "Менеджеры", href: "/dashboard/managers", icon: Settings2 },
    { label: "Операции", href: "/dashboard/admin/operations", icon: Settings2 },
  ];
  if (role === "manager") return [
    { label: "Диспетчерская", href: "/dashboard/manager", icon: LayoutDashboard },
    { label: "Склады", href: "/dashboard/warehouses", icon: Warehouse },
  ];
  if (role === "driver") return [{ label: "Мои рейсы", href: "/dashboard/driver", icon: Truck }];
  return [{ label: "Мои заказы", href: "/dashboard/client", icon: Boxes }];
}

export function WorkspaceShell({ children, headerActions }: { children: React.ReactNode; headerActions?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const workspace = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const section = pathname.split("/").filter(Boolean).pop() ?? "admin";
  const pageName = pathname.includes("/orders/") ? "Детали заказа" : pageNames[section] ?? "Рабочее пространство";
  const links = navigation(user.role);
  links.push({ label: "Документы", href: "/dashboard/documents", icon: ClipboardList });
  if (user.role === "admin" || user.role === "manager") links.push({ label: "Отчёты", href: "/dashboard/reports", icon: LayoutDashboard });
  if (user.role !== "driver") links.push({ label: "Контрагенты", href: "/dashboard/counterparties", icon: Users });
  if (user.role === "manager" && workspace.manager?.warehouseId) links.push({ label: "Мой склад", href: `/dashboard/warehouses/${workspace.manager.warehouseId}/orders`, icon: Warehouse });

  return (
    <div className={styles.page}>
      {menuOpen && <button type="button" className={styles.scrim} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarTop}>
          <BrandMark />
          <button type="button" className={styles.closeMenu} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className={styles.nav} aria-label="Основная навигация">
          {links.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href.endsWith("/operations") && pathname.includes("/orders/"));
            return <Link key={href} href={href} className={active ? styles.active : ""} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              <Icon size={19} aria-hidden="true" /><span>{label}</span>{active && <ChevronRight size={15} aria-hidden="true" />}
            </Link>;
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarUser}>
            <span className={styles.avatar}>{user.name.slice(0, 1).toUpperCase()}</span>
            <span><strong>{user.name}</strong><small>{roleNames[user.role] ?? user.role}</small></span>
          </div>
          <button type="button" className={styles.themeSwitch} onClick={toggleTheme} aria-label="Переключить тему">
            <span className={theme === "light" ? styles.themeActive : ""}>Светлая</span>
            <span className={theme === "dark" ? styles.themeActive : ""}>Тёмная</span>
          </button>
          <button type="button" className={styles.mobileExit} onClick={logout}>Выйти <LogOut size={16} /></button>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button type="button" className={styles.menuButton} aria-label="Открыть меню" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
            <span className={styles.breadcrumb}><strong>С возвращением, {user.name.split(" ")[0]}!</strong><small>{pageName} · LogiFlow</small></span>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.iconButton} aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"} onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationPanel />
            {headerActions}
            <span className={styles.headerDivider} />
            <span className={styles.avatarSmall}>{user.name.slice(0, 1).toUpperCase()}</span>
            <button type="button" className={styles.exit} onClick={logout}>Выйти</button>
          </div>
        </header>
        <main className={styles.content}>
          <div className={styles.legacyContent}>{children}</div>
        </main>
      </div>
    </div>
  );
}
