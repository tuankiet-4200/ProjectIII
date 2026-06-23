"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface InlineAddressMapProps {
  addressInfo: {
    address: string;
    ward: string;
    district: string;
    city: string;
  };
  onSelectAddress: (address: string) => void;
}

function MapEvents({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void; }) {
  useMapEvents({
    click(e) {
      onLocationFound(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16);
  }, [center, map]);
  return null;
}

export function AddressMapPicker({ addressInfo, onSelectAddress }: InlineAddressMapProps) {
  const [position, setPosition] = useState<[number, number]>([21.0285, 105.8542]); // Default Hanoi
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  const { address, ward, district, city } = addressInfo;
  const currentQueryStr = [address, ward, district, city].join("|");

  const clean = (str: string) => {
    if (!str) return "";
    return str.replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|Phường|Xã)\s+/i, "");
  };

  useEffect(() => {
    if (currentQueryStr === lastSearchedQuery || !city) return;

    const performSearch = async () => {
      setIsSearching(true);
      setLastSearchedQuery(currentQueryStr);

      const cCity = clean(city);
      const cDist = clean(district);
      const cWard = clean(ward);

      const q1 = [address, cWard, cDist, cCity].filter(Boolean).join(", ");
      const q2 = [cWard, cDist, cCity].filter(Boolean).join(", ");
      const q3 = [cDist, cCity].filter(Boolean).join(", ");
      const q4 = cCity;

      const queriesToTry = Array.from(new Set([q1, q2, q3, q4].filter(q => q.trim().length > 0)));

      try {
        for (const query of queriesToTry) {
          const res = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
          );
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const [lon, lat] = data.features[0].geometry.coordinates;
            setPosition([lat, lon]);
            break; // Found a match, stop falling back
          }
        }
      } catch (error) {
        console.error("Lỗi khi tìm kiếm địa chỉ.", error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [currentQueryStr, address, ward, district, city, lastSearchedQuery]);

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        onSelectAddress(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
  };

  return (
    <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-card-border mt-3 shadow-sm bg-foreground/5 animate-in fade-in zoom-in-95 duration-300">
      {isSearching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="px-4 py-2 bg-card rounded-full text-xs font-semibold text-violet-500 shadow-lg border border-card-border animate-pulse">
            Đang tìm kiếm vị trí...
          </div>
        </div>
      )}
      <MapContainer
        center={position}
        zoom={16}
        className="w-full h-full z-0"
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <Marker position={position} />
        <MapEvents onLocationFound={handleMapClick} />
        <MapUpdater center={position} />
      </MapContainer>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-card/95 backdrop-blur-md text-xs px-4 py-2.5 rounded-full border border-card-border text-foreground shadow-lg pointer-events-none text-center font-medium whitespace-nowrap">
        Bấm vào bản đồ để ghim chính xác vị trí
      </div>
      <style jsx global>{`
        .dark .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
}
