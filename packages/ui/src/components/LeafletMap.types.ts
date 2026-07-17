export interface LeafletMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
  pulse?: boolean;
  size?: number;
}

export interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: LeafletMarker[];
  fitToMarkers?: boolean;
  interactive?: boolean;
  style?: { flex?: number; height?: number; borderRadius?: number };
}

// Hyderabad -- same default the reference prototype (support/leaflet-map.jsx)
// and this project's seed data both use.
export const DEFAULT_CENTER: [number, number] = [17.4326, 78.4071];
