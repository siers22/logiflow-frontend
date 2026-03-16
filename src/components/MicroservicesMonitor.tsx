'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, Server, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface Microservice {
  id: string;
  name: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: Date;
  uptime: number;
  version: string;
}

const initialServices: Microservice[] = [
  { id: 'gateway-service',      name: 'API Gateway',              endpoint: 'gateway-service:8080/health',      status: 'healthy', responseTime: 45, lastCheck: new Date(), uptime: 99.98, version: 'v1.2.3' },
  { id: 'auth-service',         name: 'Auth Service',             endpoint: 'auth-service:8081/health',         status: 'healthy', responseTime: 32, lastCheck: new Date(), uptime: 99.95, version: 'v2.1.0' },
  { id: 'order-service',        name: 'Order Service',            endpoint: 'order-service:8082/health',        status: 'healthy', responseTime: 58, lastCheck: new Date(), uptime: 99.87, version: 'v1.5.2' },
  { id: 'driver-service',       name: 'Driver Service',           endpoint: 'driver-service:8083/health',       status: 'healthy', responseTime: 67, lastCheck: new Date(), uptime: 99.92, version: 'v1.8.1' },
  { id: 'assignment-service',   name: 'Assignment Service',       endpoint: 'assignment-service:8084/health',   status: 'healthy', responseTime: 41, lastCheck: new Date(), uptime: 99.89, version: 'v1.3.7' },
  { id: 'notification-service', name: 'Notification Service',     endpoint: 'notification-service:8085/health', status: 'healthy', responseTime: 54, lastCheck: new Date(), uptime: 99.91, version: 'v2.0.1' },
  { id: 'analytics-service',    name: 'Analytics Service',        endpoint: 'analytics-service:8086/health',    status: 'healthy', responseTime: 89, lastCheck: new Date(), uptime: 99.76, version: 'v2.2.0' },
  { id: 'user-service',         name: 'User Management Service',  endpoint: 'user-service:8087/health',         status: 'healthy', responseTime: 38, lastCheck: new Date(), uptime: 99.94, version: 'v1.7.3' },
  { id: 'pricing-service',      name: 'Pricing Service',          endpoint: 'pricing-service:8088/health',      status: 'healthy', responseTime: 44, lastCheck: new Date(), uptime: 99.88, version: 'v1.4.5' },
  { id: 'tracking-service',     name: 'Tracking Service',         endpoint: 'tracking-service:8089/health',     status: 'healthy', responseTime: 52, lastCheck: new Date(), uptime: 99.93, version: 'v2.1.8' },
];

function StatusIcon({ status }: { status: Microservice['status'] }) {
  if (status === 'healthy')  return <CheckCircle  className="w-5 h-5 text-green-600" />;
  if (status === 'degraded') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  return <XCircle className="w-5 h-5 text-red-600" />;
}

export function MicroservicesMonitor() {
  const [services, setServices] = useState<Microservice[]>(initialServices);
  const [isChecking, setIsChecking] = useState(false);

  const performHealthCheck = () => {
    setIsChecking(true);
    setServices((prev) =>
      prev.map((service) => {
        const rand = Math.random();
        let newStatus: Microservice['status'] = 'healthy';
        let newResponseTime = service.responseTime;

        if (rand < 0.02) {
          newStatus = 'down';
          newResponseTime = 0;
          toast.error(`🚨 Микросервис "${service.name}" недоступен!`, { description: `Эндпоинт: ${service.endpoint}`, duration: 5000 });
        } else if (rand < 0.07) {
          newStatus = 'degraded';
          newResponseTime = service.responseTime * (2 + Math.random());
          toast.warning(`⚠️ Проблемы с "${service.name}"`, { description: `Высокое время отклика: ${Math.round(newResponseTime)}ms`, duration: 4000 });
        } else {
          if (service.status === 'down') {
            toast.success(`✅ Сервис "${service.name}" восстановлен`, { description: 'Healthcheck прошел успешно', duration: 3000 });
          }
          newResponseTime = 30 + Math.random() * 70;
        }

        return {
          ...service,
          status: newStatus,
          responseTime: Math.round(newResponseTime),
          lastCheck: new Date(),
          uptime: newStatus === 'down'
            ? Math.max(service.uptime - 0.1, 95)
            : Math.min(service.uptime + 0.01, 99.99),
        };
      }),
    );
    setTimeout(() => setIsChecking(false), 800);
  };

  useEffect(() => {
    const interval = setInterval(performHealthCheck, 10000);
    return () => clearInterval(interval);
  }, []);

  const healthy  = services.filter((s) => s.status === 'healthy').length;
  const degraded = services.filter((s) => s.status === 'degraded').length;
  const down     = services.filter((s) => s.status === 'down').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Мониторинг микросервисов</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Статус Go-сервисов и API Gateway</p>
        </div>
        <Button onClick={performHealthCheck} disabled={isChecking} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Проверить сейчас
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Работает</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthy}</div>
            <p className="text-xs text-gray-500 mt-1">из {services.length} сервисов</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Проблемы</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{degraded}</div>
            <p className="text-xs text-gray-500 mt-1">деградация производительности</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Недоступно</CardTitle>
            <XCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{down}</div>
            <p className="text-xs text-gray-500 mt-1">требуется внимание</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статус сервисов</CardTitle>
          <CardDescription>
            Последняя проверка: {services[0]?.lastCheck.toLocaleTimeString('ru-RU')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className={`border rounded-lg p-4 transition-all ${
                  service.status === 'down'
                    ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800'
                    : service.status === 'degraded'
                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <StatusIcon status={service.status} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{service.name}</span>
                        <Badge variant={service.status === 'healthy' ? 'default' : service.status === 'degraded' ? 'secondary' : 'destructive'}>
                          {service.status === 'healthy' ? 'Работает' : service.status === 'degraded' ? 'Проблемы' : 'Недоступен'}
                        </Badge>
                        <span className="text-xs text-gray-500">{service.version}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{service.endpoint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {service.status === 'down'
                      ? <span className="text-red-600 dark:text-red-400">Timeout</span>
                      : <span>{service.responseTime}ms</span>
                    }
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Server className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Uptime: {service.uptime.toFixed(2)}%</span>
                    </div>
                    <span className="text-gray-500">Проверка: {service.lastCheck.toLocaleTimeString('ru-RU')}</span>
                  </div>
                  {service.status === 'down' && (
                    <Button size="sm" variant="destructive">Перезапустить</Button>
                  )}
                </div>

                <div className="mt-3">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        service.uptime >= 99.9 ? 'bg-green-600' :
                        service.uptime >= 99   ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${service.uptime}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
