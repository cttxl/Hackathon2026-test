import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Order } from '../../data/mockOrders';

// ── Fix default icon paths ─────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Custom SVG icons ───────────────────────────────────────────────────────
const hubIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#38bdf8;
    border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 0 8px #38bdf8;
  "></div>`,
  iconSize:   [16, 16],
  iconAnchor: [8, 8],
  popupAnchor:[0, -12],
});

const waypointIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:10px;height:10px;
    background:#a855f7;
    border-radius:50%;
    border:2px solid #fff;
    box-shadow:0 0 6px #a855f7;
  "></div>`,
  iconSize:   [10, 10],
  iconAnchor: [5, 5],
  popupAnchor:[0, -8],
});

const truckIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;
    background:#a855f7;
    border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 0 12px rgba(168,85,247,0.8);
    display:flex;align-items:center;justify-content:center;
    font-size:11px;line-height:1;
  ">🚛</div>`,
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
  popupAnchor:[0, -14],
});

const destIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:#22c55e;
    border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 0 10px #22c55e;
  "></div>`,
  iconSize:   [18, 18],
  iconAnchor: [9, 9],
  popupAnchor:[0, -12],
});

// ── Known location coordinates ─────────────────────────────────────────────
const KNOWN_COORDS: Record<string, [number, number]> = {
  'Central Hub Lviv':        [49.8397, 24.0297],
  'Kyiv North Node':         [50.4501, 30.5234],
  'Odesa Port Warehouse':    [46.4825, 30.7233],
  'Dnipro Logistics Center': [48.4647, 35.0462],
  'Warsaw Relay Point':      [52.2297, 21.0122],
  'Lviv Hub':                [49.8397, 24.0297],
};

const LVIV: [number, number] = [49.8397, 24.0297];

function getCoords(name: string): [number, number] {
  return KNOWN_COORDS[name] ?? LVIV;
}

/** Generate realistic intermediate waypoints between two coordinates */
function buildWaypoints(
  from: [number, number],
  to: [number, number],
  orderId: string
): [number, number][] {
  // Use order id as a deterministic seed for offset variety
  const seed = orderId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const jitter = (i: number) => ((seed * (i + 1) * 17) % 100 - 50) / 5000;

  const steps = 4; // intermediate points
  const points: [number, number][] = [from];

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lat = from[0] + (to[0] - from[0]) * t + jitter(i * 3);
    const lng = from[1] + (to[1] - from[1]) * t + jitter(i * 7);
    points.push([lat, lng]);
  }

  points.push(to);
  return points;
}

// ── Fit-bounds helper component ─────────────────────────────────────────────
function FitRoutes({ routes }: { routes: [number, number][][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || routes.length === 0) return;
    const allPoints = routes.flat();
    if (allPoints.length === 0) return;
    const bounds = L.latLngBounds(allPoints.map(c => L.latLng(c[0], c[1])));
    map.fitBounds(bounds, { padding: [40, 40] });
    fitted.current = true;
  }, [routes, map]);

  return null;
}

// ── MapWidget ──────────────────────────────────────────────────────────────
interface MapWidgetProps {
  orders?: Order[];
}

export function MapWidget({ orders = [] }: MapWidgetProps) {
  const inTransitOrders = orders.filter(o => o.status === 'In Transit');

  // Build route data for each in-transit order
  const routes = inTransitOrders.map(order => {
    const from  = getCoords(order.placeOfDeparture);
    const to    = LVIV; // Destination always the Lviv hub (can be improved with API data)
    const waypoints = buildWaypoints(from, to, order.id);
    // Truck is at ~60% of the route
    const truckIdx = Math.floor(waypoints.length * 0.6);
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
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Fit map to show all routes */}
        {allWaypoints.length > 0 && <FitRoutes routes={allWaypoints} />}

        {/* Lviv Hub marker */}
        <Marker position={LVIV} icon={hubIcon}>
          <Popup>
            <strong>Lviv Hub</strong><br />Central Logistics Command.
          </Popup>
        </Marker>

        {/* In-Transit routes */}
        {routes.map(({ order, waypoints, truckIdx }) => (
          <span key={order.id}>
            {/* Dashed path */}
            <Polyline
              positions={waypoints}
              pathOptions={{
                color:     '#a855f7',
                weight:    2.5,
                opacity:   0.85,
                dashArray: '10, 8',
                lineCap:   'round',
              }}
            />

            {/* Origin marker */}
            <Marker position={waypoints[0]} icon={hubIcon}>
              <Popup>
                <strong>Origin</strong><br />
                {order.placeOfDeparture}<br />
                <em>{order.transportName}</em>
              </Popup>
            </Marker>

            {/* Intermediate waypoint markers */}
            {waypoints.slice(1, -1).map((wp, i) => (
              <Marker key={i} position={wp} icon={waypointIcon}>
                <Popup>
                  <strong>Waypoint {i + 1}</strong><br />
                  Order #{order.id}
                </Popup>
              </Marker>
            ))}

            {/* Truck position marker (at 60% of route) */}
            <Marker position={waypoints[truckIdx]} icon={truckIcon}>
              <Popup>
                <strong>🚛 In Transit</strong><br />
                {order.transportName}<br />
                Driver: {order.driverName}<br />
                ETA: {order.timeOfArrival}
              </Popup>
            </Marker>

            {/* Destination marker */}
            <Marker position={waypoints[waypoints.length - 1]} icon={destIcon}>
              <Popup>
                <strong>Destination</strong><br />
                Lviv Hub<br />
                ETA: {order.timeOfArrival}
              </Popup>
            </Marker>
          </span>
        ))}
      </MapContainer>
    </div>
  );
}
