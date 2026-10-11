"use client";
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import type { Coordinate } from "@/lib/api";
import "leaflet/dist/leaflet.css";
export function RouteMapInner({ coordinates, currentIndex }: { coordinates: Coordinate[]; currentIndex: number }) {
  const container = useRef<HTMLDivElement>(null), mapRef = useRef<L.Map | null>(null), layersRef = useRef<L.LayerGroup | null>(null), geometryRef = useRef("");
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { center: [0, 0], zoom: 10 });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    layersRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; layersRef.current = null; geometryRef.current = ""; };
  }, []);
  useEffect(() => {
    const map = mapRef.current, layers = layersRef.current;
    if (!map || !layers) return;
    layers.clearLayers();
    const points = coordinates.filter(point => point.length === 2 && point.every(Number.isFinite)).map(([lng, lat]) => [lat, lng] as L.LatLngTuple);
    if (!points.length) return;
    const index = Math.max(0, Math.min(currentIndex, points.length - 1));
    if (points.length >= 2) {
      L.polyline(points, { color: "#475569", weight: 4, opacity: 0.5 }).addTo(layers);
      if (index > 0) L.polyline(points.slice(0, index + 1), { color: "#3b82f6", weight: 5 }).addTo(layers);
      L.polyline(points.slice(index), { color: "#64748b", weight: 4, dashArray: "10 6" }).addTo(layers);
    }
    L.circleMarker(points[0], { radius: 8, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 1 }).addTo(layers);
    L.circleMarker(points[points.length - 1], { radius: 8, color: "#dc2626", fillColor: "#ef4444", fillOpacity: 1 }).addTo(layers);
    if (index > 0) L.circleMarker(points[index], { radius: 10, color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 1 }).addTo(layers);
    const geometry = JSON.stringify(points);
    if (geometry !== geometryRef.current) { map.fitBounds(L.latLngBounds(points), { padding: [20, 20], maxZoom: 14 }); geometryRef.current = geometry; }
  }, [coordinates, currentIndex]);
  return <div ref={container} role="img" aria-label="Карта рассчитанного маршрута" style={{ height: 320, width: "100%", borderRadius: 12 }} />;
}
