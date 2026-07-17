import { useEffect, useRef, useState } from "react";
import { DEFAULT_CENTER, type LeafletMapProps } from "./LeafletMap.types";

// This project's tsconfig deliberately has no "dom" lib (React Native has its
// own overlapping global types), so DOM access throughout this file goes
// through an untyped `webGlobal` escape hatch -- same pattern already used
// for `navigator` in refer-a-friend.tsx. Leaflet itself is loaded from a CDN
// at runtime (not bundled as an npm dependency) so there's no HTMLElement-
// typed @types/leaflet surface to fight either -- this mirrors exactly how
// the original prototype's support/leaflet-map.jsx reference loads it.
const webGlobal = globalThis as unknown as {
  window: Record<string, unknown> & { L?: LeafletNamespace; __leafletLoading?: (() => void)[] };
  document: {
    createElement: (tag: string) => Record<string, unknown>;
    head: { appendChild: (node: unknown) => void };
  };
};

interface LeafletNamespace {
  map: (el: unknown, opts: Record<string, unknown>) => LeafletMapInstance;
  tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (map: LeafletMapInstance) => void };
  divIcon: (opts: Record<string, unknown>) => unknown;
  marker: (latlng: [number, number], opts: Record<string, unknown>) => { addTo: (map: LeafletMapInstance) => unknown };
  latLngBounds: (points: [number, number][]) => unknown;
}
interface LeafletMapInstance {
  setView: (center: [number, number], zoom: number) => void;
  invalidateSize: () => void;
  remove: () => void;
  removeLayer: (layer: unknown) => void;
  fitBounds: (bounds: unknown, opts: Record<string, unknown>) => void;
}

let loadPromise: Promise<void> | null = null;
function ensureLeaflet(): Promise<void> {
  if (webGlobal.window.L) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve) => {
    const link = webGlobal.document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    webGlobal.document.head.appendChild(link);

    const pulseStyle = webGlobal.document.createElement("style");
    pulseStyle.textContent = "@keyframes llPulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.1);opacity:0}}";
    webGlobal.document.head.appendChild(pulseStyle);

    const script = webGlobal.document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve();
    webGlobal.document.head.appendChild(script);
  });
  return loadPromise;
}

function markerHtml(color: string, size: number, label: string | undefined, pulse: boolean | undefined): string {
  const pulseHtml = pulse
    ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color}33;animation:llPulse 1.6s ease-out infinite"></div>`
    : "";
  return `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">${pulseHtml}<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;">${label ?? ""}</div></div>`;
}

// Real Leaflet + OpenStreetMap tiles -- no API key, no billing account, same
// tile source and CDN-loading approach the original prototype used
// (support/leaflet-map.jsx). This file only bundles into the web build
// (moduleSuffixes-driven platform resolution); native uses
// LeafletMap.native.tsx via a WebView instead.
export function LeafletMap({ center, zoom = 13, markers = [], fitToMarkers, interactive = true, style }: LeafletMapProps) {
  const containerRef = useRef<unknown>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerLayersRef = useRef<unknown[]>([]);
  const [ready, setReady] = useState(Boolean(webGlobal.window?.L));

  useEffect(() => {
    let mounted = true;
    void ensureLeaflet().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const L = webGlobal.window.L as LeafletNamespace;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
    });
    map.setView(center ?? DEFAULT_CENTER, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const L = webGlobal.window.L as LeafletNamespace;
    markerLayersRef.current.forEach((m) => map.removeLayer(m));
    markerLayersRef.current = markers.map((m) => {
      const size = m.size ?? 30;
      const icon = L.divIcon({
        className: "",
        html: markerHtml(m.color ?? "#0F7A5E", size, m.label, m.pulse),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      return L.marker([m.lat, m.lng], { icon }).addTo(map);
    });

    if (fitToMarkers && markers.length > 1) {
      map.fitBounds(
        L.latLngBounds(markers.map((m) => [m.lat, m.lng])),
        { padding: [36, 36] },
      );
    } else if (center) {
      map.setView(center, zoom);
    } else if (markers.length === 1) {
      map.setView([markers[0]!.lat, markers[0]!.lng], zoom);
    }
  }, [ready, JSON.stringify(markers), center?.join(","), fitToMarkers]);

  return (
    <div
      ref={containerRef as never}
      style={{
        width: "100%",
        height: style?.height ?? 200,
        flex: style?.flex,
        borderRadius: style?.borderRadius ?? 13,
        overflow: "hidden",
        backgroundColor: "#EEF1F4",
      }}
    />
  );
}
