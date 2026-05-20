"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io } from "socket.io-client";

// Fix Leaflet icons for Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const truckIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-full bg-violet-600 border-2 border-white shadow-xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
  className: "bg-transparent",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
  className: "bg-transparent",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface TrackingMapProps {
  shopOrderId: string;
  shippingAddress?: string;
}

// Auto-pan map when shipper position changes
function MapAutoCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);
  return null;
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address) return null;

  // Clean common Vietnamese prefixes that confuse geocoders
  const clean = (s: string) =>
    s.replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|Phường|Xã)\s+/gi, "");

  // Parse comma-separated address parts; reverse to start from most-general
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);

  // Build queries from most-specific to least-specific
  const queries: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const slice = parts.slice(i).map(clean).join(", ");
    if (slice.trim()) queries.push(slice.trim());
  }

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      if (data?.features?.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        return [lat, lon];
      }
    } catch {
      // Swallow and continue to next fallback
    }
  }
  return null;
}

export default function TrackingMap({ shopOrderId, shippingAddress }: TrackingMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  // Geocode the real shipping address once
  useEffect(() => {
    if (!shippingAddress) return;
    geocodeAddress(shippingAddress).then((coords) => {
      if (coords) setDestination(coords);
    });
  }, [shippingAddress]);

  // Connect to GPS socket for live shipper position
  useEffect(() => {
    let backendUrl = "http://localhost:3000";
    if (process.env.NEXT_PUBLIC_API_URL) {
      backendUrl = process.env.NEXT_PUBLIC_API_URL.replace("/api", "");
    }

    const socket = io(`${backendUrl}/gps-tracking`, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("joinTrackingRoom", { shopOrderId });
    });

    socket.on("locationUpdated", (data: { lat: number; lng: number }) => {
      setPosition([data.lat, data.lng]);
    });

    return () => {
      socket.disconnect();
    };
  }, [shopOrderId]);

  const mapCenter: [number, number] =
    position || destination || [21.0135, 105.7845];

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-card-border/50 shadow-sm z-0">
      <MapContainer
        center={mapCenter}
        zoom={position ? 15 : destination ? 15 : 13}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {/* Live shipper marker */}
        {position && (
          <>
            <MapAutoCenter center={position} />
            <Marker position={position} icon={truckIcon}>
              <Popup>
                <span className="font-semibold text-violet-600 text-xs">Tài xế đang di chuyển</span>
              </Popup>
            </Marker>
          </>
        )}

        {/* Geocoded destination marker */}
        {destination && (
          <Marker position={destination} icon={destinationIcon}>
            <Popup>
              <span className="font-semibold text-emerald-600 text-xs">Điểm giao hàng</span>
            </Popup>
          </Marker>
        )}

        {/* Dashed route line */}
        {position && destination && (
          <Polyline
            positions={[position, destination]}
            color="#8b5cf6"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Show geocoding status when destination is being resolved */}
      {shippingAddress && !destination && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-md text-xs px-4 py-2 rounded-full border border-card-border text-slate-500 shadow-lg animate-pulse whitespace-nowrap">
          Đang định vị điểm đến...
        </div>
      )}

      <style jsx global>{`
        .dark .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
}
