import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { DriverOrder } from '../../pages/DriverPage';

// ── Icon fix ────────────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Custom icons ────────────────────────────────────────────────────────────
const makeCircleIcon = (color: string, size: number, glow = true) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:3px solid #fff;
      ${glow ? `box-shadow:0 0 10px ${color};` : ''}
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -size / 2 - 4],
  });

const originIcon  = makeCircleIcon('#38bdf8', 16);
const waypointIcon = makeCircleIcon('#f59e0b', 10);
const destIcon    = makeCircleIcon('#22c55e', 18);
const truckIcon   = L.divIcon({
  className: '',
  html: `<div style="
    width:26px;height:26px;
    background:#f97316;
    border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 0 14px rgba(249,115,22,0.9);
    display:flex;align-items:center;justify-content:center;
    font-size:13px;
  ">🚛</div>`,
  iconSize:   [26, 26],
  iconAnchor: [13, 13],
  popupAnchor:[0, -16],
});

// ── Known coordinates ───────────────────────────────────────────────────────
const KNOWN_COORDS: Record<string, [number, number]> = {
  'Central Hub Lviv':        [49.8397, 24.0297],
  'Kyiv North Node':         [50.4501, 30.5234],
  'Odesa Port Warehouse':    [46.4825, 30.7233],
  'Dnipro Logistics Center': [48.4647, 35.0462],
  'Warsaw Relay Point':      [52.2297, 21.0122],
  'Lviv Hub':                [49.8397, 24.0297],
};
const LVIV: [number, number] = [49.8397, 24.0297];
const getCoords = (name: string): [number, number] => KNOWN_COORDS[name] ?? LVIV;

function buildWaypoints(
  from: [number, number],
  to: [number, number],
  seed: number
): [number, number][] {
  const jitter = (i: number) => ((seed * (i + 1) * 17) % 100 - 50) / 4000;
  const steps = 4;
  const pts: [number, number][] = [from];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    pts.push([
      from[0] + (to[0] - from[0]) * t + jitter(i * 3),
      from[1] + (to[1] - from[1]) * t + jitter(i * 7),
    ]);
  }
  pts.push(to);
  return pts;
}

// ── FitRoutes helper ────────────────────────────────────────────────────────
function FitRoutes({ routes }: { routes: [number, number][][] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || routes.length === 0) return;
    const bounds = L.latLngBounds(routes.flat().map(c => L.latLng(c[0], c[1])));
    map.fitBounds(bounds, { padding: [48, 48] });
    done.current = true;
  }, [routes, map]);
  return null;
}

// ── DriverMapWidget ─────────────────────────────────────────────────────────
interface DriverMapWidgetProps {
  orders: DriverOrder[];
}

export function DriverMapWidget({ orders }: DriverMapWidgetProps) {
  const routes = orders
    .filter(o => !o.completed)
    .map((order, idx) => {
      const from      = getCoords(order.departure);
      const to        = getCoords(order.destination);
      const seed      = idx * 31 + order.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const waypoints = buildWaypoints(from, to, seed);
      const truckIdx  = Math.floor(waypoints.length * 0.55);
      return { order, waypoints, truckIdx };
    });

  const allWaypoints = routes.map(r => r.waypoints);

  return (
    <div style={{
      height: '100%', width: '100%',
      borderRadius: '16px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <MapContainer
        center={LVIV}
        zoom={7}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {allWaypoints.length > 0 && <FitRoutes routes={allWaypoints} />}

        {routes.map(({ order, waypoints, truckIdx }) => (
          <span key={order.id}>
            {/* Dashed route line */}
            <Polyline
              positions={waypoints}
              pathOptions={{
                color:     '#f97316',
                weight:    3,
                opacity:   0.9,
                dashArray: '10, 8',
                lineCap:   'round',
              }}
            />

            {/* Origin */}
            <Marker position={waypoints[0]} icon={originIcon}>
              <Popup>
                <strong>📦 Origin</strong><br />
                {order.departure}
              </Popup>
            </Marker>

            {/* Intermediate waypoints */}
            {waypoints.slice(1, -1).map((wp, i) => (
              <Marker key={i} position={wp} icon={waypointIcon}>
                <Popup>
                  <strong>Checkpoint {i + 1}</strong><br />
                  Order #{order.id}
                </Popup>
              </Marker>
            ))}

            {/* Truck marker at ~55% */}
            <Marker position={waypoints[truckIdx]} icon={truckIcon}>
              <Popup>
                <strong>🚛 Your position</strong><br />
                Order #{order.id}<br />
                {order.transportName}<br />
                ETA to {order.destination}: <strong>{order.eta}</strong>
              </Popup>
            </Marker>

            {/* Destination */}
            <Marker position={waypoints[waypoints.length - 1]} icon={destIcon}>
              <Popup>
                <strong>🏁 Destination</strong><br />
                {order.destination}<br />
                ETA: <strong>{order.eta}</strong>
              </Popup>
            </Marker>
          </span>
        ))}
      </MapContainer>
    </div>
  );
}
