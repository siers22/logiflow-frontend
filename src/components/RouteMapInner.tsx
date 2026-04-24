"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import type { Coordinate } from "@/lib/api";
import "leaflet/dist/leaflet.css";

interface Props {
  coordinates: Coordinate[];
  currentIndex: number;
}

function FitBounds({ coordinates }: { coordinates: Coordinate[] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length < 2) return;
    const latLngs = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    map.fitBounds(latLngs, { padding: [20, 20] });
  }, [coordinates, map]);
  return null;
}

export function RouteMapInner({ coordinates, currentIndex }: Props) {
  const firstCoord = coordinates[0];
  if (!firstCoord) return null;

  // Leaflet uses [lat, lng], backend sends [lng, lat]
  const latLngs = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
  const passedLatLngs = latLngs.slice(0, currentIndex + 1);
  const remainingLatLngs = latLngs.slice(currentIndex);

  const currentPos = latLngs[Math.min(currentIndex, latLngs.length - 1)];
  const startPos = latLngs[0];
  const endPos = latLngs[latLngs.length - 1];

  return (
    <MapContainer
      center={currentPos ?? startPos}
      zoom={10}
      style={{ height: "320px", width: "100%", borderRadius: "12px" }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds coordinates={coordinates} />

      {/* Весь маршрут (серая подложка) */}
      {latLngs.length >= 2 && (
        <Polyline positions={latLngs} color="#475569" weight={4} opacity={0.5} />
      )}

      {/* Пройденный маршрут */}
      {passedLatLngs.length >= 2 && (
        <Polyline positions={passedLatLngs} color="#3b82f6" weight={5} opacity={0.95} />
      )}

      {/* Оставшийся маршрут */}
      {remainingLatLngs.length >= 2 && (
        <Polyline positions={remainingLatLngs} color="#64748b" weight={4} opacity={0.75} dashArray="10 6" />
      )}

      {/* Старт */}
      <CircleMarker center={startPos} radius={8} color="#16a34a" fillColor="#22c55e" fillOpacity={1} weight={2} />

      {/* Финиш */}
      <CircleMarker center={endPos} radius={8} color="#dc2626" fillColor="#ef4444" fillOpacity={1} weight={2} />

      {/* Текущая позиция водителя */}
      {currentIndex > 0 && currentPos && (
        <CircleMarker center={currentPos} radius={10} color="#1d4ed8" fillColor="#3b82f6" fillOpacity={1} weight={2} />
      )}
    </MapContainer>
  );
}
