# LogiFlow — Next.js

Курсовой проект **LogiFlow** — веб-приложение для управления логистикой, переписанное с Vite/React SPA на **Next.js 15 App Router** + TypeScript.


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
│       ├── reports/page.tsx
│       ├── counterparties/page.tsx
│       ├── documents/page.tsx
│       ├── warehouses/[id]/orders/page.tsx
│       ├── admin/page.tsx
│       └── orders/[id]/page.tsx    # Динамический маршрут для деталей заказа
├── components/
│   ├── LoginForm.tsx               # 'use client'
│   ├── DashboardLayout.tsx         # 'use client' — хедер с темой и logout
│   ├── AuthGuard.tsx               # 'use client' — защита маршрутов
│   ├── OrderDetailsPage.tsx        # 'use client' — карточка перевозки и команды ролей
│   ├── MicroservicesMonitor.tsx    # 'use client' — честное состояние «Нет данных»
│   ├── dashboards/
│   │   ├── ClientDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── DriverDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── ui/                        # shadcn/ui компоненты (без изменений)
├── lib/
│   ├── ThemeContext.tsx            # SSR-safe тема (light/dark + View Transitions)
│   ├── UserContext.tsx             # Глобальная авторизация + useRouter
│   └── mockData.ts                # Моковые данные (без изменений)
└── types/
    └── index.ts                   # User, UserRole
```

## Пример адресов пользователей (только при наличии таких учётных записей в БД)

| Роль        | Email                  | Страница                    |
|-------------|------------------------|-----------------------------|
| Клиент      | client@demo.com        | `/dashboard/client`         |
| Менеджер    | manager@demo.com       | `/dashboard/manager`        |
| Водитель    | driver@demo.com        | `/dashboard/driver`         |
| Администратор | admin@demo.com       | `/dashboard/admin`          |

## Запуск

```bash
nvm use
npm ci
npm run dev
```

Приложение запустится на [http://localhost:3000](http://localhost:3000).

### Подключение актуального бэкенда

Контракты фронтенда сверены с `anxi0uz/logiflow@30465820e96b4b6d389d5d3b6e29882c0e885b2c`. Запустите бэкенд с актуальными миграциями, PostgreSQL, Redis, NATS JetStream, Dispatch и Documents; Core должен отвечать на `http://localhost:3001/health/live`. Затем запустите фронт:

```bash
LOGIFLOW_API_UPSTREAM=http://localhost:3001 npm run dev
```

`LOGIFLOW_API_UPSTREAM` задаёт адрес Core для Next.js rewrite; установите её до `npm run build` при сборке для другой сети. В контейнере используйте адрес сервиса Core, поскольку `localhost` указывает на сам контейнер. Браузер обращается только к `/api/*` фронта. Для восстановления сессии Core устанавливает `Secure` refresh-cookie; поведение cookie следует проверять в целевом HTTPS-окружении.

Указанные выше демонстрационные email не создаются этим фронтендом и могут отсутствовать в вашей БД. Самостоятельная регистрация создаёт только клиента. Для рабочего маршрута заказа администратор должен создать активный склад и машину с действующим документом регистрации, а также менеджера этого склада и доступного водителя. После создания откроется черновик. Заполните контрагентов и сохраните реквизиты перевозки, затем отправьте заказ на распределение. Складские операции, инциденты и фактическая приёмка доступны в общей карточке заказа.

Проверки: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

Браузерные проверки: `npm run test:e2e`. На macOS используется установленный Google Chrome. На Linux установите Chromium: `npx playwright install --with-deps chromium`. Тесты поднимают локальный Next.js на `127.0.0.1:3100` и перехватывают API через фикстуры; рабочая база не используется. Они проверяют интерфейс, но не заменяют приёмку с настоящим Core/Dispatch/Documents и HTTPS-cookie.

Docker использует Node 24. Адрес Core фиксируется при сборке:

```bash
docker build --build-arg LOGIFLOW_API_UPSTREAM=http://core:3001 -t logiflow-frontend .
```

Карта показывает маршрут и положение из ответа Core; REST polling сам не запускает серверный трекер и не является GPS. Входящие передачи новому водителю пока открываются по известной ссылке на заказ: API списка приглашений отсутствует.

## Ключевые решения при миграции

### 1. Роутинг
В оригинале навигация работала через `useState` в `App.tsx`. В Next.js каждая роль — это отдельная страница в файловой системе. Для детальной страницы заказа используется динамический сегмент `[id]`.

### 2. Авторизация
`UserContext` хранит access token и пользователя только в памяти и восстанавливает сессию по refresh-cookie. Параллельные 401 используют один refresh; поздние ответы после logout или смены сессии игнорируются. `AuthGuard` проверяет четыре серверные роли; старый адрес `/dashboard/management` перенаправляет в отчёты с проверкой доступа.

### 3. Server vs Client компоненты
Страницы (`page.tsx`) — Server Components. Все интерактивные компоненты с хуками помечены `'use client'`. shadcn/ui компоненты с Radix уже содержат `'use client'` директиву.

### 4. SSR-безопасный localStorage
`ThemeContext` сохраняет тему на клиенте. `UserContext` очищает старые сохранённые токены; в localStorage остаётся только сигнал logout для других вкладок. Новые токены туда не записываются.
