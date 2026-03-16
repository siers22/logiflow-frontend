# LogiFlow — Next.js

Курсовой проект **LogiFlow** — веб-приложение для управления логистикой, переписанное с Vite/React SPA на **Next.js 15 App Router** + TypeScript.

## Технологии

| Было (Vite SPA)          | Стало (Next.js 15)                      |
|--------------------------|------------------------------------------|
| `App.tsx` — useState роутер | App Router — файловая система `/app` |
| Единый `User` state      | `UserContext` + `localStorage`           |
| `onLogout` prop drilling | `useUser()` hook везде                   |
| `selectedOrder` в state  | URL `/dashboard/orders/[id]`             |
| Нет SSR                  | Server Components + Client Components    |

## Структура проекта

```
src/
├── app/
│   ├── layout.tsx                  # Root layout — провайдеры, метаданные
│   ├── page.tsx                    # Редирект → /login
│   ├── globals.css                 # Tailwind v4 + CSS переменные + View Transitions
│   ├── login/
│   │   └── page.tsx
│   └── dashboard/
│       ├── layout.tsx
│       ├── client/page.tsx
│       ├── manager/page.tsx
│       ├── driver/page.tsx
│       ├── management/page.tsx
│       ├── admin/page.tsx
│       └── orders/[id]/page.tsx    # Динамический маршрут для деталей заказа
├── components/
│   ├── LoginForm.tsx               # 'use client'
│   ├── DashboardLayout.tsx         # 'use client' — хедер с темой и logout
│   ├── AuthGuard.tsx               # 'use client' — защита маршрутов
│   ├── OrderDetailsPage.tsx        # 'use client' — анимация трекинга
│   ├── MicroservicesMonitor.tsx    # 'use client' — симуляция healthcheck
│   ├── dashboards/
│   │   ├── ClientDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── DriverDashboard.tsx
│   │   ├── ManagementDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── ui/                        # shadcn/ui компоненты (без изменений)
├── lib/
│   ├── ThemeContext.tsx            # SSR-safe тема (light/dark + View Transitions)
│   ├── UserContext.tsx             # Глобальная авторизация + useRouter
│   └── mockData.ts                # Моковые данные (без изменений)
└── types/
    └── index.ts                   # User, UserRole
```

## Демо-пользователи (быстрый вход)

| Роль        | Email                  | Страница                    |
|-------------|------------------------|-----------------------------|
| Клиент      | client@demo.com        | `/dashboard/client`         |
| Менеджер    | manager@demo.com       | `/dashboard/manager`        |
| Водитель    | driver@demo.com        | `/dashboard/driver`         |
| Руководство | management@demo.com    | `/dashboard/management`     |
| Администратор | admin@demo.com       | `/dashboard/admin`          |

## Запуск

```bash
npm install
npm run dev
```

Приложение запустится на [http://localhost:3000](http://localhost:3000).

## Ключевые решения при миграции

### 1. Роутинг
В оригинале навигация работала через `useState` в `App.tsx`. В Next.js каждая роль — это отдельная страница в файловой системе. Для детальной страницы заказа используется динамический сегмент `[id]`.

### 2. Авторизация
`UserContext` хранит пользователя в `localStorage` и предоставляет `login()` / `logout()` с `useRouter`. `AuthGuard` проверяет роль и редиректит при несоответствии.

### 3. Server vs Client компоненты
Страницы (`page.tsx`) — Server Components. Все интерактивные компоненты с хуками помечены `'use client'`. shadcn/ui компоненты с Radix уже содержат `'use client'` директиву.

### 4. SSR-безопасный localStorage
`ThemeContext` и `UserContext` читают `localStorage` только внутри `useEffect` (только на клиенте), что предотвращает гидрационные ошибки.
