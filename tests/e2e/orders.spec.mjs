import { test, expect } from '@playwright/test';
import { setup } from './fixtures.mjs';
test('client creates a mixed-route draft, saves transport snapshot and submits without forbidden history', async ({
  page,
}) => {
  const state = await setup(page, { transportDetails: null });
  await page.goto('/dashboard/client');
  await page.getByRole('button', { name: 'Новая заявка' }).click();
  await page.getByLabel(/^Отправление/).selectOption('address');
  await page
    .getByLabel(/^Адрес/)
    .first()
    .fill('Москва, ул. Тестовая, 1');
  await page.getByLabel(/^Назначение/).selectOption('warehouse');
  await page.getByLabel(/^Склад/).selectOption('w2');
  await page
    .getByLabel('Забрать с *', { exact: true })
    .fill('2099-01-01T10:00');
  await page
    .getByLabel('Забрать до *', { exact: true })
    .fill('2099-01-01T12:00');
  await page
    .getByRole('button', { name: 'Создать черновик', exact: true })
    .click();
  await expect(page).toHaveURL(/orders\/order-1/);
  await page.getByLabel(/^Отправитель \*/).selectOption('sender');
  await page.getByLabel(/^Получатель \*/).selectOption('recipient');
  await page.getByLabel(/^Перевозчик \*/).selectOption('carrier');
  await page.getByLabel('Номер основания *', { exact: true }).fill('42');
  await page.getByLabel('Дата основания *', { exact: true }).fill('2026-10-11');
  await page
    .getByRole('button', { name: 'Сохранить реквизиты перевозки', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Отправить на распределение',
      exact: true,
    }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Отправить на распределение', exact: true })
    .click();
  await expect.poll(() => state.order.status).toBe('ready_for_dispatch');
  expect(
    state.calls.filter(
      (c) => c.method === 'POST' && c.path === '/api/v1/orders',
    ),
  ).toHaveLength(1);
  expect(
    state.calls.filter((c) => c.path.endsWith('/assignments')),
  ).toHaveLength(0);
  const create = state.calls.find(
    (c) => c.method === 'POST' && c.path === '/api/v1/orders',
  );
  expect(create.body.originWarehouseId).toBeUndefined();
  expect(create.body.destinationWarehouseId).toBe('w2');
});
test('manager receives cargo once and resolves automatic shortage before loading', async ({
  page,
}, testInfo) => {
  const state = await setup(page, { role: 'manager', status: 'assigned' });
  await page.goto('/dashboard/orders/order-1');
  await page
    .getByRole('button', { name: 'Принять отправление', exact: true })
    .click();
  await page.getByLabel('Фактическое число мест *', { exact: true }).fill('1');
  await page
    .getByLabel('Состояние груза *', { exact: true })
    .fill('Без повреждений');
  await page
    .getByRole('button', { name: 'Подтвердить операцию', exact: true })
    .dblclick();
  await expect(
    page.getByText('Автоматическая недостача', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Подтвердить погрузку', exact: true }),
  ).toHaveCount(0);
  expect(state.operations).toHaveLength(1);
  await page.screenshot({
    path: testInfo.outputPath('logiflow-order-warehouse.png'),
    fullPage: true,
  });
  await page
    .getByLabel('Обоснование решения *', { exact: true })
    .fill('Согласовано с отправителем');
  await page
    .getByRole('button', { name: 'Сохранить решение', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Подтвердить погрузку', exact: true }),
  ).toBeVisible();
});
test('warehouse destination accepts zero packages and completes only after receipt', async ({
  page,
}) => {
  const state = await setup(page, {
    role: 'manager',
    warehouseId: 'w2',
    status: 'arrived',
    assignmentStatus: 'active',
  });
  await page.goto('/dashboard/orders/order-1');
  await expect(
    page.getByRole('button', { name: 'Завершить перевозку', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Подтвердить разгрузку', exact: true })
    .click();
  await page.getByLabel('Фактическое число мест *', { exact: true }).fill('0');
  await page
    .getByLabel('Состояние груза *', { exact: true })
    .fill('Груз отсутствует');
  await page
    .getByRole('button', { name: 'Подтвердить операцию', exact: true })
    .click();
  await page
    .getByLabel('Обоснование решения *', { exact: true })
    .fill('Согласована полная недостача');
  await page
    .getByRole('button', { name: 'Сохранить решение', exact: true })
    .click();
  await page
    .getByLabel('ФИО получателя *', { exact: true })
    .fill('Иванов Иван');
  await page
    .getByLabel('Должность / роль *', { exact: true })
    .fill('Кладовщик');
  await page
    .getByLabel('Основание полномочий *', { exact: true })
    .fill('Доверенность № 1');
  await page.getByLabel('Фактическое число мест *', { exact: true }).fill('0');
  await page
    .getByLabel('Состояние груза *', { exact: true })
    .fill('Не поступил');
  await page.getByRole('checkbox', { name: /Данные проверены/ }).check();
  await page
    .getByRole('button', { name: 'Зафиксировать приёмку', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Завершить перевозку', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Завершить перевозку', exact: true })
    .click();
  await expect.poll(() => state.order.status).toBe('completed');
  expect(state.receipt.packageCount).toBe(0);
  expect(state.calls.find((c) => c.path.endsWith('/complete')).body).toEqual(
    {},
  );
});
test('driver cannot complete warehouse delivery or plan it', async ({
  page,
}) => {
  await setup(page, {
    role: 'driver',
    status: 'arrived',
    assignmentStatus: 'active',
    operations: [
      { id: 'unload', operationType: 'unload', assignmentId: 'trip-1' },
    ],
    receipt: {
      id: 'receipt',
      assignmentId: 'trip-1',
      receivedAt: '2026-10-11T10:00:00Z',
      recordedAt: '2026-10-11T10:00:00Z',
    },
  });
  await page.goto('/dashboard/orders/order-1');
  await expect(
    page.getByRole('heading', { name: 'Фактическая приёмка' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Завершить перевозку', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Отправить предложение', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Контрагенты', exact: true }),
  ).toHaveCount(0);
});
test('counterparty quick form validates and trims before saving', async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto('/dashboard/counterparties');
  await page
    .getByRole('button', { name: 'Добавить контрагента', exact: true })
    .click();
  await page.getByLabel(/^Вид контрагента/).selectOption('individual');
  await page
    .getByLabel('Название / ФИО *', { exact: true })
    .fill('  Новый получатель  ');
  await page.getByLabel('Адрес *', { exact: true }).fill('  Москва  ');
  await page.getByLabel('Контактное лицо *', { exact: true }).fill('  Иван  ');
  await page.getByLabel('Телефон', { exact: true }).fill('+7 900 000-00-00');
  await page
    .getByRole('button', { name: 'Сохранить контрагента', exact: true })
    .click();
  await expect(
    page.getByText('Новый получатель', { exact: true }),
  ).toBeVisible();
  expect(state.parties.at(-1).name).toBe('Новый получатель');
  expect(
    state.calls.find(
      (c) => c.path === '/api/v1/counterparties' && c.method === 'POST',
    ).body.shared,
  ).toBeUndefined();
});
test('dispatch selection sends original microsecond timestamp', async ({
  page,
}) => {
  const createdAt = '2026-10-11T12:01:02.123456Z';
  const state = await setup(page, {
    role: 'manager',
    status: 'ready_for_dispatch',
    recommendations: {
      status: 'ready',
      createdAt,
      candidates: [
        {
          id: 'recommendation-1',
          driver_id: 'driver-1',
          vehicle_id: 'vehicle-1',
          score: 99,
          reason: 'Подходит по вместимости',
        },
      ],
    },
  });
  await page.goto('/dashboard/orders/order-1');
  await page.getByRole('button', { name: /Подходит по вместимости/ }).click();
  await page
    .getByLabel('Начало планового окна *', { exact: true })
    .fill('2099-01-01T10:00');
  await page
    .getByLabel('Конец планового окна *', { exact: true })
    .fill('2099-01-01T12:00');
  await page
    .getByRole('button', { name: 'Отправить предложение', exact: true })
    .click();
  await expect.poll(() => state.order.status).toBe('assigned');
  const body = state.calls.find(
    (c) => c.path.endsWith('/assignments') && c.method === 'POST',
  ).body;
  expect(body.source).toBe('dispatch_recommendation');
  expect(body.recommendationCreatedAt).toBe(createdAt);
});
test('vehicle-only handover keeps old assignment until both driver acknowledgements', async ({
  page,
}) => {
  const state = await setup(page, {
    role: 'driver',
    status: 'in_transit',
    assignmentStatus: 'active',
    handovers: [
      {
        id: 'handover-1',
        previousAssignmentId: 'trip-1',
        driverId: 'driver-1',
        vehicleId: 'vehicle-new',
        status: 'pending',
        expiresAt: '2099-01-01T10:00:00Z',
        location: 'Тестовая стоянка',
        reason: 'Поломка',
        cargoCondition: 'Целый',
      },
    ],
  });
  await page.goto('/dashboard/orders/order-1');
  await page
    .getByRole('button', { name: 'Подтвердить передачу груза', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Принять груз и рейс', exact: true }),
  ).toBeVisible();
  expect(state.assignments[0].status).toBe('active');
  expect(state.assignments[0].vehicleId).toBe('vehicle-1');
  await page
    .getByRole('button', { name: 'Принять груз и рейс', exact: true })
    .click();
  await expect.poll(() => state.handovers[0].status).toBe('completed');
  expect(state.assignments[0].status).toBe('released');
  expect(state.assignments[1].vehicleId).toBe('vehicle-new');
  expect(state.order.status).toBe('in_transit');
});
test('order workspace fits a mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, { role: 'manager', status: 'assigned' });
  await page.goto('/dashboard/orders/order-1');
  await expect(
    page.getByRole('button', { name: 'Принять отправление', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test('quick counterparty creation preserves draft and does not submit parent form', async ({
  page,
}) => {
  const state = await setup(page, { transportDetails: null });
  await page.goto('/dashboard/orders/order-1');
  await page
    .getByRole('button', { name: 'Добавить', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Вид контрагента/).selectOption('individual');
  await dialog
    .getByLabel('Название / ФИО *', { exact: true })
    .fill('Отправитель из черновика');
  await dialog.getByLabel('Адрес *', { exact: true }).fill('Москва');
  await dialog.getByLabel('Контактное лицо *', { exact: true }).fill('Иван');
  await dialog.getByLabel('Телефон', { exact: true }).fill('+7 900 000-00-00');
  await dialog
    .getByRole('button', { name: 'Сохранить контрагента', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel(/^Отправитель \*/)).toHaveValue('new-3');
  expect(
    state.calls.filter(
      (c) => c.path.endsWith('/transport-details') && c.method === 'PUT',
    ),
  ).toHaveLength(0);
  expect(state.order.status).toBe('draft');
});
test('receipt conflict reloads immutable saved record without a second POST', async ({
  page,
}) => {
  const state = await setup(page, {
    role: 'manager',
    warehouseId: 'w2',
    status: 'arrived',
    assignmentStatus: 'active',
    operations: [
      {
        id: 'unload',
        operationType: 'unload',
        assignmentId: 'trip-1',
        packageCount: 2,
      },
    ],
  });
  state.receiptConflict = true;
  await page.goto('/dashboard/orders/order-1');
  await page
    .getByLabel('ФИО получателя *', { exact: true })
    .fill('Иванов Иван');
  await page
    .getByLabel('Должность / роль *', { exact: true })
    .fill('Кладовщик');
  await page
    .getByLabel('Основание полномочий *', { exact: true })
    .fill('Доверенность');
  await page.getByLabel('Фактическое число мест *', { exact: true }).fill('2');
  await page.getByLabel('Состояние груза *', { exact: true }).fill('Целый');
  await page.getByRole('checkbox', { name: /Данные проверены/ }).check();
  await page
    .getByRole('button', { name: 'Зафиксировать приёмку', exact: true })
    .click();
  await expect(page.getByText('Иванов Иван', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Зафиксировать приёмку', exact: true }),
  ).toHaveCount(0);
  expect(
    state.calls.filter(
      (c) => c.path.endsWith('/delivery-receipt') && c.method === 'POST',
    ),
  ).toHaveLength(1);
});
