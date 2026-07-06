'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useRef } from 'react';

export interface ShopPin {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

interface ShopsMapProps {
  shops: ShopPin[];
  onSelect?: (shop: ShopPin) => void;
}

// Default center roughly over Uzbekistan when there are no shops yet.
const FALLBACK_CENTER: [number, number] = [41.3, 64.6];
const FALLBACK_ZOOM = 6;

/**
 * Lightweight OpenStreetMap/Leaflet view of shop locations — no API key or
 * billing setup required (unlike Google Maps JS SDK), which is all this
 * admin-only "show shop pins on a map" need calls for. Leaflet is loaded
 * dynamically inside an effect so it never touches `window`/`document`
 * during the Next.js static export build.
 */
export default function ShopsMap({ shops, onSelect }: ShopsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView(FALLBACK_CENTER, FALLBACK_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;

      // Clear previous markers before redrawing (shops list can change on search/refetch).
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const activeIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:9999px;background:#16a34a;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const inactiveIcon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:9999px;background:#dc2626;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      shops.forEach((s) => {
        if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') return;
        const marker = L.marker([s.latitude, s.longitude], { icon: s.isActive ? activeIcon : inactiveIcon })
          .addTo(map)
          .bindPopup(`<b>${escapeHtml(s.name)}</b><br/>${escapeHtml(s.address)}`);
        if (onSelect) marker.on('click', () => onSelect(s));
        markersRef.current.push(marker);
      });

      const withCoords = shops.filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number');
      if (withCoords.length > 0) {
        const bounds = L.latLngBounds(withCoords.map((s) => [s.latitude, s.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
      }
    })();

    return () => { cancelled = true; };
  }, [shops, onSelect]);

  // Tear down the map instance on unmount (route change).
  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  return <div ref={containerRef} className="h-[520px] w-full rounded-xl" />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
