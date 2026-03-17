"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import "./css/glass-card.css";
import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex gap-2",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  variant?: "glass";
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Общие стили, которые подходят обоим вариантам
        "inline-flex items-center justify-center gap-1.5",
        "text-sm font-medium whitespace-nowrap",
        "transition-[color,box-shadow,transform,background-color]",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:border-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        variant === "glass"
          ? cn(
              "glass-card",
              "text-foreground dark:text-foreground/90",
              "min-w-fit min-w-max-content", // ← не даёт сжиматься слишком сильно
              "px-5 py-2", // ← больше воздуха по бокам
              "overflow-hidden",
              // активное состояние — чуть ярче / приподнято
              "data-[state=active]:bg-white/70 dark:data-[state=active]:bg-white/15",
              "data-[state=active]:shadow-lg data-[state=active]:shadow-black/10",
              "data-[state=active]:text-foreground dark:data-[state=active]:text-white",
              "data-[state=active]:-translate-y-px", // лёгкий lift-эффект (опционально)
            )
          : cn(
              // дефолтный вариант (твой старый стиль, но чище)
              "rounded-xl border border-transparent",
              "px-4 py-1.5",
              "text-foreground dark:text-muted-foreground",
              "data-[state=active]:bg-card data-[state=active]:text-foreground",
              "dark:data-[state=active]:bg-input/30 dark:data-[state=active]:border-input",
              "flex-1", // flex-1 оставляем только в обычном варианте, если нужно
            ),

        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
