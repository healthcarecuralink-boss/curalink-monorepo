function ensureLeaflet(cb) {
  if (window.L) { cb(); return; }
  if (window.__leafletLoading) { window.__leafletLoading.push(cb); return; }
  window.__leafletLoading = [cb];
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.textContent = '@keyframes llPulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.1);opacity:0}} .ll-pulse-wrap{position:relative;display:flex;align-items:center;justify-content:center} .ll-pulse-ring{position:absolute;inset:0;border-radius:50%;animation:llPulse 1.6s ease-out infinite}';
  document.head.appendChild(style);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => { (window.__leafletLoading || []).forEach(fn => fn()); window.__leafletLoading = []; };
  document.head.appendChild(script);
}

function LeafletMap(props) {
  const ref = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const [ready, setReady] = React.useState(!!window.L);

  React.useEffect(() => {
    let mounted = true;
    ensureLeaflet(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (!ready || !ref.current || mapRef.current) return;
    const L = window.L;
    const center = props.center || [17.4326, 78.4071];
    const map = L.map(ref.current, {
      zoomControl: false, attributionControl: false,
      dragging: props.interactive !== false, scrollWheelZoom: props.interactive !== false,
      doubleClickZoom: props.interactive !== false, touchZoom: props.interactive !== false,
    }).setView(center, props.zoom || 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
  }, [ready]);

  React.useEffect(() => {
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  const markersKey = JSON.stringify(props.markers || []);
  React.useEffect(() => {
    if (!mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    (props.markers || []).forEach(m => {
      const size = m.size || 30;
      const pulseHtml = m.pulse ? '<div class="ll-pulse-ring" style="background:' + (m.color || '#0F7A5E') + '33"></div>' : '';
      const html = '<div class="ll-pulse-wrap" style="width:' + size + 'px;height:' + size + 'px;">' + pulseHtml +
        '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + (m.color || '#0F7A5E') + ';border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:' + (m.fontSize || 11) + 'px;font-weight:800;color:#fff;">' + (m.label || '') + '</div></div>';
      const icon = L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      markersRef.current.push(marker);
    });
    if (props.fitToMarkers && props.markers && props.markers.length > 1) {
      const bounds = L.latLngBounds(props.markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [36, 36] });
    } else if (props.center) {
      map.setView(props.center, props.zoom || map.getZoom());
    }
  }, [ready, markersKey, props.center ? props.center.join(',') : '']);

  return React.createElement('div', { ref, style: Object.assign({ width: '100%', height: '100%', background: '#EEF1F4' }, props.style || {}) });
}

window.LeafletMap = LeafletMap;
module.exports = { LeafletMap };
