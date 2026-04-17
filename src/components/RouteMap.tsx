"use client";

import dynamic from "next/dynamic";
import type { Coordinate } from "@/lib/api";

const RouteMapInner = dynamic(
  () => import("./RouteMapInner").then((m) => m.RouteMapInner),
  { ssr: false, loading: () => <div className="h-[320px] rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm">Загрузка карты...</div> },
);

interface RouteMapProps {
  coordinates: Coordinate[];
  currentIndex: number;
}

export function RouteMap({ coordinates, currentIndex }: RouteMapProps) {
  return <RouteMapInner coordinates={coordinates} currentIndex={currentIndex} />;
}
