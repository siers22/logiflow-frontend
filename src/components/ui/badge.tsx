import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Clock, Truck, CircleCheck, UserCheck, CircleX } from "lucide-react";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        // ── базовые ──────────────────────────────────────────────────────────
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 dark:bg-destructive/60",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",

        // ── роли ─────────────────────────────────────────────────────────────
        roleAdmin:
          "border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        roleClient:
          "border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        roleDriver:
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        roleManager:
          "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        roleManagement:
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",

        // ── статусы заказов ───────────────────────────────────────────────────
        statusPending:
          "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        statusAssigned:
          "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        statusInProgress:
          "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        statusDelivered:
          "border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        statusCancelled:
          "border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────

const roleVariantMap: Record<
  string,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  admin: "roleAdmin",
  client: "roleClient",
  driver: "roleDriver",
  manager: "roleManager",
  management: "roleManagement",
};

const roleLabelMap: Record<string, string> = {
  admin: "Администратор",
  client: "Клиент",
  driver: "Водитель",
  manager: "Менеджер",
  management: "Руководство",
};

function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <Badge variant={roleVariantMap[role] ?? "outline"} className={className}>
      {roleLabelMap[role] ?? role}
    </Badge>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    variant: VariantProps<typeof badgeVariants>["variant"];
    label: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    variant: "statusPending",
    label: "Ожидает",
    icon: <Clock />,
  },
  assigned: {
    variant: "statusAssigned",
    label: "Назначен водитель",
    icon: <UserCheck />,
  },
  in_progress: {
    variant: "statusInProgress",
    label: "В пути",
    icon: <Truck />,
  },
  delivered: {
    variant: "statusDelivered",
    label: "Доставлен",
    icon: <CircleCheck />,
  },
  cancelled: {
    variant: "statusCancelled",
    label: "Отменён",
    icon: <CircleX />,
  },
};

function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const cfg = statusConfig[status] ?? statusConfig.pending;

  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

export { Badge, badgeVariants, RoleBadge, StatusBadge };
