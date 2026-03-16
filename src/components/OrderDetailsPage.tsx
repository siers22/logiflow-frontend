'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, User, MapPin, Clock, Phone, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockOrders, type Order } from '@/lib/mockData';

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Москва':           { lat: 55.7558, lng: 37.6173 },
  'Санкт-Петербург':  { lat: 59.9311, lng: 30.3609 },
  'Казань':           { lat: 55.7963, lng: 49.1088 },
  'Тверь':            { lat: 56.8587, lng: 35.9176 },
  'Екатеринбург':     { lat: 56.8389, lng: 60.6057 },
  'Нижний Новгород':  { lat: 56.3269, lng: 44.0059 },
  'Ростов-на-Дону':   { lat: 47.2357, lng: 39.7015 },
  'Краснодар':        { lat: 45.0355, lng: 38.9753 },
  'Самара':           { lat: 53.2001, lng: 50.1500 },
  'Уфа':              { lat: 54.7388, lng: 55.9721 },
};

function getCityFromAddress(address: string) {
  return address.split(',')[0];
}

function getDeliveryProgress(status: string) {
  const map: Record<string, number> = { pending: 0, assigned: 20, in_progress: 60, delivered: 100, cancelled: 0 };
  return map[status] ?? 0;
}

const statusVariants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending:     { label: 'Ожидает',          variant: 'secondary' },
  assigned:    { label: 'Назначен водитель', variant: 'default' },
  in_progress: { label: 'В пути',           variant: 'default' },
  delivered:   { label: 'Доставлен',        variant: 'outline' },
  cancelled:   { label: 'Отменен',          variant: 'destructive' },
};

interface OrderDetailsPageProps {
  orderId: string;
}

export function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const router = useRouter();
  const order: Order | undefined = mockOrders.find((o) => o.id === orderId);
  const [cargoProgress, setCargoProgress] = useState(0);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'in_progress') {
      const interval = setInterval(() => {
        setCargoProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 100);
      return () => clearInterval(interval);
    } else if (order.status === 'delivered') {
      setCargoProgress(100);
    } else if (order.status === 'assigned') {
      setCargoProgress(20);
    } else {
      setCargoProgress(0);
    }
  }, [order]);

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Заказ не найден</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>Назад</Button>
        </div>
      </DashboardLayout>
    );
  }

  const pickupCity   = getCityFromAddress(order.pickupAddress);
  const deliveryCity = getCityFromAddress(order.deliveryAddress);
  const pickupCoords  = cityCoordinates[pickupCity]   ?? cityCoordinates['Москва'];
  const deliveryCoords = cityCoordinates[deliveryCity] ?? cityCoordinates['Санкт-Петербург'];
  const progress = getDeliveryProgress(order.status);
  const currentProgress = order.status === 'in_progress' ? cargoProgress : progress;

  const currentLat = pickupCoords.lat + (deliveryCoords.lat - pickupCoords.lat) * (currentProgress / 100);
  const currentLng = pickupCoords.lng + (deliveryCoords.lng - pickupCoords.lng) * (currentProgress / 100);

  const minLat = Math.min(pickupCoords.lat, deliveryCoords.lat);
  const maxLat = Math.max(pickupCoords.lat, deliveryCoords.lat);
  const minLng = Math.min(pickupCoords.lng, deliveryCoords.lng);
  const maxLng = Math.max(pickupCoords.lng, deliveryCoords.lng);

  const mapW = 800;
  const mapH = 500;
  const pad  = 80;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const scale = Math.min((mapW - 2 * pad) / lngRange, (mapH - 2 * pad) / latRange);

  const toPixel = (lat: number, lng: number) => ({
    x: pad + (lng - minLng) * scale,
    y: mapH - pad - (lat - minLat) * scale,
  });

  const pp = toPixel(pickupCoords.lat,  pickupCoords.lng);
  const dp = toPixel(deliveryCoords.lat, deliveryCoords.lng);
  const cp = toPixel(currentLat, currentLng);

  const badge = statusVariants[order.status] ?? statusVariants.pending;
  const estimatedHours = Math.ceil((order.distance / 80) * (1 - currentProgress / 100));
  const eta = new Date();
  eta.setHours(eta.getHours() + estimatedHours);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-gray-900 dark:text-gray-100">Заявка {order.id}</h1>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Отслеживание груза в реальном времени</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Маршрут доставки</CardTitle>
              <p className="text-sm text-gray-500">{pickupCity} → {deliveryCity} • {order.distance} км</p>
            </CardHeader>
            <CardContent>
              <div className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: 500 }}>
                {/* Grid bg */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Route SVG */}
                <svg width="100%" height="100%" viewBox={`0 0 ${mapW} ${mapH}`} className="absolute inset-0">
                  {/* Route line */}
                  <path d={`M ${pp.x} ${pp.y} L ${dp.x} ${dp.y}`} stroke="#3b82f6" strokeWidth="3" strokeDasharray="8 4" fill="none" opacity="0.6" />

                  {/* Pickup */}
                  <g transform={`translate(${pp.x},${pp.y})`}>
                    <circle r="12" fill="#10b981" opacity="0.2" />
                    <circle r="8" fill="#10b981" />
                    <circle r="3" fill="white" />
                  </g>
                  <text x={pp.x} y={pp.y - 20} textAnchor="middle" fontSize="13" className="fill-gray-900 dark:fill-gray-100">{pickupCity}</text>

                  {/* Delivery */}
                  <g transform={`translate(${dp.x},${dp.y})`}>
                    <circle r="12" fill="#ef4444" opacity="0.2" />
                    <circle r="8" fill="#ef4444" />
                    <circle r="3" fill="white" />
                  </g>
                  <text x={dp.x} y={dp.y - 20} textAnchor="middle" fontSize="13" className="fill-gray-900 dark:fill-gray-100">{deliveryCity}</text>

                  {/* Current position */}
                  {order.status === 'in_progress' && (
                    <g transform={`translate(${cp.x},${cp.y})`}>
                      <circle r="20" fill="#f59e0b" opacity="0.3">
                        <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle r="10" fill="#f59e0b" />
                      <path d="M -4 -2 L 4 -2 L 4 2 L 2 2 L 2 6 L -2 6 L -2 2 L -4 2 Z" fill="white" />
                    </g>
                  )}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Пункт отправления</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-700 dark:text-gray-300">Пункт назначения</span>
                  </div>
                  {order.status === 'in_progress' && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-gray-700 dark:text-gray-300">Текущая позиция</span>
                    </div>
                  )}
                </div>

                {order.status === 'in_progress' && (
                  <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Прогресс</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(currentProgress)}%</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Детали заказа</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Груз</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.cargoType}</div>
                    <div className="text-xs text-gray-500">{order.weight} кг</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Откуда</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{order.pickupAddress}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Куда</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{order.deliveryAddress}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Создана</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(order.createdAt).toLocaleString('ru-RU')}</div>
                  </div>
                </div>
                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Стоимость</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{order.price.toLocaleString('ru-RU')} ₽</span>
                </div>
              </CardContent>
            </Card>

            {order.driverName && (
              <Card>
                <CardHeader><CardTitle>Водитель</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.driverName}</div>
                      <div className="text-xs text-gray-500">ID: {order.driverId}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Позвонить водителю
                  </Button>
                </CardContent>
              </Card>
            )}

            {order.status === 'in_progress' && (
              <Card>
                <CardHeader><CardTitle>Расчетное время прибытия</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {eta.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-500">{eta.toLocaleDateString('ru-RU')}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Примерно через {estimatedHours} {estimatedHours === 1 ? 'час' : estimatedHours < 5 ? 'часа' : 'часов'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Прогресс доставки</span>
                      <span className="text-gray-900 dark:text-gray-100">{Math.round(currentProgress)}%</span>
                    </div>
                    <Progress value={currentProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {order.status === 'delivered' && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-green-800 dark:text-green-200">Доставлено успешно!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-green-700 dark:text-green-300">Дата доставки</div>
                      <div className="text-sm text-green-900 dark:text-green-100">{new Date(order.updatedAt).toLocaleString('ru-RU')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
