"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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
}

export default function TrackingMap({ shopOrderId }: TrackingMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Determine backend URL
    let backendUrl = "http://localhost:3000";
    if (process.env.NEXT_PUBLIC_API_URL) {
      backendUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    }

    const socket = io(`${backendUrl}/gps-tracking`, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to GPS Tracking socket");
      socket.emit("joinTrackingRoom", { shopOrderId });
    });

    socket.on("locationUpdated", (data: { lat: number; lng: number }) => {
      setPosition([data.lat, data.lng]);
      setDestination((prev) => {
        if (prev) return prev;
        // Shift destination slightly to show a realistic route
        return [data.lat + 0.003, data.lng + 0.004];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [shopOrderId]);

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-card-border/50 shadow-sm z-0">
      <MapContainer
        center={position || [21.0135, 105.7845]} // Centered on Mễ Trì, Hanoi
        zoom={position ? 15 : 13}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        {position && (
          <Marker position={position} icon={truckIcon}>
            <Popup>
              <span className="font-semibold text-violet-600 text-xs">Tài xế đang di chuyển</span>
            </Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={destination} icon={destinationIcon}>
            <Popup>
              <span className="font-semibold text-emerald-600 text-xs">Điểm giao hàng</span>
            </Popup>
          </Marker>
        )}
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
      <style jsx global>{`
        /* Make leaflet dark mode compatible */
        .dark .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
}
