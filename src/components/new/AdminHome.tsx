"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownToLine, ArrowRight, Boxes, ChevronRight,
  MapPinned, Package, PackageCheck, RefreshCw, Truck,
} from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { api, type DashboardReport, type Driver, type Order, type Route, type Vehicle } from "@/lib/api";
import { RouteMap } from "@/components/RouteMap";
import { WorkspaceShell } from "./WorkspaceShell";
import styles from "./AdminHome.module.css";

const statusLabels: Record<Order["status"], string> = {
  draft: "Черновик", ready_for_dispatch: "Ждёт назначения", assigned: "Назначен",
  in_transit: "В пути", arrived: "Прибыл", completed: "Доставлен", cancelled: "Отменён",
};


function shortId(id: string) { return id.slice(0, 8).toUpperCase(); }
function formatDate(value: string) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(value)); }
function formatNumber(value: number) { return new Intl.NumberFormat("ru-RU").format(value); }
function plural(value: number, one: string, few: string, many: string) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 14) return many;
  if (value % 10 === 1) return one;
  if (value % 10 >= 2 && value % 10 <= 4) return few;
  return many;
}

export function AdminHome() {
  const { user, withAuth } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    setError(null);
    const results = await Promise.allSettled([
      withAuth((token) => api.orders.list(token)),
      withAuth((token) => api.drivers.list(token)),
      withAuth((token) => api.vehicles.list(token)),
      withAuth((token) => api.reports.dashboard(token)),
    ]);
    if (results[0].status === "fulfilled") setOrders(results[0].value);
    if (results[1].status === "fulfilled") setDrivers(results[1].value);
    if (results[2].status === "fulfilled") setVehicles(results[2].value);
    if (results[3].status === "fulfilled") setReport(results[3].value);
    if (results.some((result) => result.status === "rejected")) setError("Часть данных не загрузилась. Обновите страницу или попробуйте ещё раз.");
    setLoading(false); setRefreshing(false);
  }, [withAuth]);

  useEffect(() => { void load(true); }, [load]);

  const sortedOrders = useMemo(() => [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [orders]);
  useEffect(() => { if (!selectedId && sortedOrders[0]) setSelectedId(sortedOrders[0].id); }, [selectedId, sortedOrders]);
  const selectedOrder = sortedOrders.find((order) => order.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) { setRoute(null); return; }
    let alive = true;
    setRoute(null);
    withAuth((token) => api.routes.get(token, selectedId))
      .then((value) => { if (alive) setRoute(value); })
      .catch(() => { if (alive) setRoute(null); });
    return () => { alive = false; };
  }, [selectedId, withAuth]);

  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const count = orders.filter((order) => {
        const created = new Date(order.createdAt);
        return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth();
      }).length;
      return { label: new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(date), count };
    });
  }, [orders]);
  const maxMonth = Math.max(1, ...monthly.map((month) => month.count));
  const monthCount = monthly[5]?.count ?? 0;
  const activeCount = orders.filter((order) => ["assigned", "in_transit", "arrived"].includes(order.status)).length;
  const deliveredCount = report?.orders.delivered ?? orders.filter((order) => order.status === "completed").length;
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "available").length;

  async function downloadReport() {
    setDownloading(true);
    try {
      const blob = await withAuth((token) => api.reports.orders(token));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "logiflow-orders.xlsx"; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError("Не удалось скачать отчёт."); }
    finally { setDownloading(false); }
  }

  if (!user) return null;

  const orderProgress = selectedOrder ? ({
    draft: 10, ready_for_dispatch: 25, assigned: 45, in_transit: 70,
    arrived: 90, completed: 100, cancelled: 0,
  } as const)[selectedOrder.status] : 0;
  const place = (address: string | null | undefined) => address?.split(",")[0]?.trim() || "—";

  return <WorkspaceShell headerActions={<>
    <button type="button" className={styles.iconButton} aria-label="Обновить данные" onClick={() => void load()} disabled={refreshing}><RefreshCw size={17} className={refreshing ? styles.spin : ""}/></button>
    <Link className={styles.topCta} href="/dashboard/admin/operations">Открыть заказы <ArrowRight size={15}/></Link>
  </>}>
    <div className={styles.content}>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <section className={styles.metrics} aria-label="Основные показатели">
            <div className={styles.metric}><span>Заказы за месяц</span><div className={styles.metricLine}><span className={styles.metricIcon}><Boxes size={18}/></span><strong>{loading ? "—" : formatNumber(monthCount)}</strong><small>{plural(monthCount, "заказ", "заказа", "заказов")}</small><div className={styles.sparkBars} aria-hidden="true">{monthly.map((item, i) => <i key={i} style={{height: `${12 + item.count / maxMonth * 37}px`}}/>)}</div></div><div className={styles.sparkLabels}>{monthly.map((item, i) => <small key={i}>{item.label}</small>)}</div></div>
            <div className={styles.metric}><span>В работе</span><div className={styles.metricLine}><span className={styles.metricIcon}><Truck size={18}/></span><strong>{loading ? "—" : formatNumber(activeCount)}</strong><small>рейсов</small><div className={styles.sparkTicks} aria-hidden="true">{Array.from({length: 7}, (_, i) => <i key={i} style={{height: `${15 + ((i * 9 + activeCount * 7) % 27)}px`}}/>)}</div></div><p>{orders.filter((order) => order.status === "ready_for_dispatch").length} ждут назначения</p></div>
            <div className={styles.metric}><span>Доставлено</span><div className={styles.metricLine}><span className={styles.metricIcon}><PackageCheck size={18}/></span><strong>{loading ? "—" : formatNumber(deliveredCount)}</strong><small>{plural(deliveredCount, "заказ", "заказа", "заказов")}</small><div className={styles.sparkDots} aria-hidden="true"><i/><i/><i/><i/><i/></div></div><p>{drivers.length} {plural(drivers.length, "водитель", "водителя", "водителей")} · {availableVehicles} свободных ТС</p></div>
          </section>

          <div className={styles.dashboardGrid}>
            <div className={styles.leftStack}>
              <section className={`${styles.card} ${styles.packageCard}`} aria-labelledby="package-title"><div className={styles.cardTitleRow}><h2 id="package-title">Детали груза</h2><span className={styles.cardPill}>{selectedOrder ? statusLabels[selectedOrder.status] : "Нет заказа"}</span></div>{selectedOrder ? <><p className={styles.cargoDescription}>{selectedOrder.cargoDescription || "Груз без описания"}</p><div className={styles.packageStats}><div><strong>{selectedOrder.weightKg == null ? "—" : formatNumber(selectedOrder.weightKg)}</strong><small>кг · вес</small></div><div><strong>{selectedOrder.volumeM3 == null ? "—" : selectedOrder.volumeM3}</strong><small>м³ · объём</small></div></div><div className={styles.destination}><span><Package size={17}/></span><div><small>Пункт назначения</small><strong>{selectedOrder.destinationAddress}</strong></div></div></> : <p className={styles.emptyOrders}>Выберите заказ ниже, чтобы увидеть груз.</p>}</section>
              <section className={`${styles.card} ${styles.speedCard}`} aria-labelledby="speed-title"><h2 id="speed-title">Движение заказов</h2><div className={styles.speedLegend}><span><i/>В процессе</span><span><i/>Доставлено</span></div><div className={styles.progressRing} style={{background: `conic-gradient(#8a78e6 0 ${orders.length ? Math.round((activeCount + deliveredCount) / orders.length * 100) : 0}%, #efedf2 0 100%)`}}><div><strong>{activeCount + deliveredCount}</strong><small>из {orders.length} {plural(orders.length, "заказа", "заказов", "заказов")}</small></div></div></section>
            </div>

            <div className={styles.middleStack}>
              <section className={`${styles.card} ${styles.orderCard}`} aria-labelledby="order-title"><div className={styles.cardTitleRow}><h2 id="order-title">Информация о заказе</h2>{selectedOrder && <Link href={`/dashboard/orders/${selectedOrder.id}`}>Подробнее <ChevronRight size={13}/></Link>}</div>{selectedOrder ? <><div className={styles.journey}><div><strong>{place(selectedOrder.originAddress)}</strong><strong>{place(selectedOrder.destinationAddress)}</strong></div><div className={styles.journeyLine}><span/><Truck size={24}/><span/></div><small>ПУНКТ ОТПРАВЛЕНИЯ <span>ПУНКТ ДОСТАВКИ</span></small></div><div className={styles.orderFacts}><strong>#{shortId(selectedOrder.id)}</strong><div><span>Создан</span><b>{formatDate(selectedOrder.createdAt)}</b></div><div><span>Статус</span><b>{statusLabels[selectedOrder.status]}</b></div><div><span>Забрать с</span><b>{selectedOrder.pickupFrom ? formatDate(selectedOrder.pickupFrom) : "—"}</b></div></div><div className={styles.completion}><span className={styles.progressDot}/><strong>{orderProgress}% выполнено</strong><span>Этап доставки</span><ChevronRight size={14}/></div></> : <p className={styles.emptyOrders}>Заказы появятся после создания заявки.</p>}</section>
              <section className={`${styles.card} ${styles.vehicleCard}`} aria-labelledby="vehicle-title"><div className={styles.vehicleText}><small>ТРАНСПОРТ</small><h2 id="vehicle-title">{vehicles[0] ? [vehicles[0].brand, vehicles[0].model].filter(Boolean).join(" ") || "Автомобиль парка" : "Парк доставки"}</h2><p>{vehicles[0] ? vehicles[0].plateNumber : "Машины ещё не добавлены"}</p><Link href="/dashboard/vehicles">Открыть парк <ArrowRight size={13}/></Link></div><Image className={styles.vehicleImage} src="/images/dashboard-van.png" alt="Концепт развозного автомобиля" width={360} height={240}/></section>
            </div>

            <section className={`${styles.card} ${styles.routeCard}`} aria-labelledby="route-title"><div className={styles.mapHeading}><h2 id="route-title">Карта доставки</h2><MapPinned size={17}/></div>{selectedOrder && <span className={styles.mapOrder}>Заказ #{shortId(selectedOrder.id)}</span>}{route && route.coordinates.length >= 2 ? <div className={styles.mapFrame}><RouteMap coordinates={route.coordinates} currentIndex={route.currentIndex}/></div> : <div className={styles.mapEmpty}><MapPinned size={28}/><strong>Маршрут пока недоступен</strong><span>Карта появится после построения маршрута.</span></div>}<div className={styles.routeFoot}><span><strong>{route?.distanceKm != null ? `${formatNumber(Math.round(route.distanceKm))} км` : "—"}</strong><small>Дистанция</small></span><span><strong>{route?.durationSec ? `${Math.round(route.durationSec / 60)} мин` : "—"}</strong><small>В пути</small></span>{selectedOrder && <Link href={`/dashboard/orders/${selectedOrder.id}`} aria-label="Открыть заказ"><ArrowRight size={17}/></Link>}</div></section>
          </div>

          <section className={styles.ordersSection} id="orders" aria-labelledby="orders-title"><div className={styles.ordersHeader}><div><h2 id="orders-title">Последние заказы</h2><p>Выберите заявку, чтобы увидеть груз и маршрут</p></div><button type="button" className={styles.reportButton} onClick={() => void downloadReport()} disabled={downloading}><ArrowDownToLine size={15}/>{downloading ? "Подготовка..." : "Скачать отчёт"}</button></div>{sortedOrders.length === 0 ? <p className={styles.emptyOrders}>Заказов пока нет.</p> : <div className={styles.orderList}>{sortedOrders.slice(0, 5).map((order) => <button type="button" key={order.id} className={`${styles.orderRow} ${order.id === selectedId ? styles.selectedOrder : ""}`} onClick={() => setSelectedId(order.id)}><span className={styles.orderGlyph}><Boxes size={17}/></span><span className={styles.orderInfo}><strong>#{shortId(order.id)}</strong><small>{order.destinationAddress}</small></span><span className={`${styles.statusBadge} ${styles[`status_${order.status}`]}`}>{statusLabels[order.status]}</span><time>{formatDate(order.createdAt)}</time></button>)}</div>}<Link href="/dashboard/admin/operations" className={styles.inlineLink}>Все операции <ArrowRight size={15}/></Link></section>
    </div>
  </WorkspaceShell>;
}
