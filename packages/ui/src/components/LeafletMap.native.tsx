import { useMemo } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { DEFAULT_CENTER, type LeafletMapProps } from "./LeafletMap.types";

function buildHtml(props: LeafletMapProps): string {
  const { center, zoom = 13, markers = [], fitToMarkers, interactive = true } = props;
  const initialCenter = center ?? DEFAULT_CENTER;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #EEF1F4; }
    @keyframes llPulse { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.1); opacity: 0; } }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: ${interactive},
      scrollWheelZoom: ${interactive},
      doubleClickZoom: ${interactive},
      touchZoom: ${interactive},
    }).setView([${initialCenter[0]}, ${initialCenter[1]}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const markers = ${JSON.stringify(markers)};
    const layers = markers.map(function (m) {
      const size = m.size || 30;
      const color = m.color || '#0F7A5E';
      const pulseHtml = m.pulse ? '<div style="position:absolute;inset:0;border-radius:50%;background:' + color + '33;animation:llPulse 1.6s ease-out infinite"></div>' : '';
      const html = '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;">' + pulseHtml +
        '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;">' + (m.label || '') + '</div></div>';
      const icon = L.divIcon({ className: '', html: html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      return L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
    });

    if (${Boolean(fitToMarkers)} && markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(function (m) { return [m.lat, m.lng]; }));
      map.fitBounds(bounds, { padding: [36, 36] });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], ${zoom});
    }
  </script>
</body>
</html>`;
}

// Real Leaflet + OpenStreetMap tiles, same as the web variant -- rendered
// inside a WebView since RN has no DOM of its own. The whole HTML string is
// regenerated on marker/center changes rather than message-passing into the
// WebView; GPS updates land every several seconds, so a full reload is cheap
// and far simpler than a bidirectional bridge.
export function LeafletMap(props: LeafletMapProps) {
  const html = useMemo(() => buildHtml(props), [JSON.stringify(props.markers), props.center?.join(","), props.zoom, props.fitToMarkers, props.interactive]);

  return (
    <View
      style={[
        {
          width: "100%",
          height: props.style?.height ?? 200,
          flex: props.style?.flex,
          borderRadius: props.style?.borderRadius ?? 13,
          overflow: "hidden",
          backgroundColor: "#EEF1F4",
        },
      ]}
    >
      <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1, backgroundColor: "transparent" }} scrollEnabled={false} />
    </View>
  );
}
