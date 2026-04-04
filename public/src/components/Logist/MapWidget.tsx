import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Order, ApiDeliveryPoint, ApiProduct, ApiVehicle } from '../../types/api';

// ── Fix default icon paths ─────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -12],
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
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  popupAnchor: [0, -8],
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
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
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
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

function getPointIcon(type: string) {
  let color = '#f59e0b';
  let emoji = '';
  let size = 16;

  if (type === 'warehouse') {
    emoji = '🏠'; // House / Warehouse
    size = 20;
  } else if (type === 'client_point') {
    emoji = '📍';
    size = 18;
  } else if (type === 'provider') {
    emoji = '🏭';
    size = 20;
  } else if (type === 'vehicle') {
    emoji = '🚚'; // Vehicle / Truck
    size = 24;
  }

  if (emoji) {
    return L.divIcon({
      className: '',
      html: `<div style="
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size}px;
        line-height: ${size}px;
        text-shadow: 0px 0px 5px rgba(255,255,255,1), 0px 0px 10px rgba(255,255,255,0.8);
      ">${emoji}</div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  }

  // Fallback simple dot
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;
      background:${color};
      border-radius:3px;
      border:2px solid #fff;
      box-shadow:0 0 8px ${color};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ── Known location coordinates ─────────────────────────────────────────────
const KNOWN_COORDS: Record<string, [number, number]> = {
  'Central Hub Lviv': [49.8397, 24.0297],
  'Kyiv North Node': [50.4501, 30.5234],
  'Odesa Port Warehouse': [46.4825, 30.7233],
  'Dnipro Logistics Center': [48.4647, 35.0462],
  'Warsaw Relay Point': [52.2297, 21.0122],
  'Lviv Hub': [49.8397, 24.0297],
  'вул. Тестова, 1, Львів': [49.8350, 24.0300],
  'вул. Шевченка, 317, Львів': [49.8524, 23.9613],
  'вул. Городоцька, 355, Львів': [49.8188, 23.9472],
  'вул. Зелена, 153, Львів': [49.8143, 24.0534],
  'вул. Джорджа Вашингтона, 8': [49.8213, 24.0673],
  'вул. Стрийська, 45': [49.8055, 24.0182],
};

const LVIV: [number, number] = [49.8397, 24.0297];

function getCoords(name: string): [number, number] {
  return KNOWN_COORDS[name] ?? LVIV;
}

function getAddressCoords(address: string | undefined, seedStr: string, geoMap: Record<string, [number, number]>): [number, number] {
  if (!address) return LVIV;
  if (KNOWN_COORDS[address]) return KNOWN_COORDS[address];
  const resolved = geoMap[address];
  if (resolved && resolved[0] !== 0) return resolved;

  // Deterministic fallback
  const seed = seedStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const latOffset = ((seed * 13) % 100 - 50) / 1000.0;
  const lngOffset = ((seed * 17) % 100 - 50) / 1000.0;
  return [49.8397 + latOffset, 24.0297 + lngOffset];
}

function getDeliveryPointCoords(dp: ApiDeliveryPoint, geoMap: Record<string, [number, number]>): [number, number] {
  return getAddressCoords(dp.address, dp.id || dp.name || 'fallback', geoMap);
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
  deliveryPoints?: ApiDeliveryPoint[];
  inventoryMap?: Map<string, ApiProduct[]>;
  vehicles?: ApiVehicle[];
}

export function MapWidget({ orders = [], deliveryPoints = [], inventoryMap, vehicles = [] }: MapWidgetProps) {
  const inTransitOrders = orders.filter(o => o.status === 'In Transit');
  const [geoMap, setGeoMap] = useState<Record<string, [number, number]>>({});

  useEffect(() => {
    let active = true;

    async function fetchCoords() {
      const currentMap = { ...geoMap };
      let updated = false;

      // Extract all unique addresses explicitly
      const addressesToFetch = new Set<string>();
      deliveryPoints.forEach(dp => dp.address && addressesToFetch.add(dp.address));
      vehicles.forEach(v => v.address && addressesToFetch.add(v.address));

      // Loop over points sequentially to respect OSM's 1 req/sec limit
      for (const address of Array.from(addressesToFetch)) {
        if (!active) break;
        if (!address) continue;
        
        // Skip if already definitively cached locally or explicitly known
        if (currentMap[address] || KNOWN_COORDS[address]) continue;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address + ', Львів')}`);
          const data = await res.json();
          if (active && data && data.length > 0) {
            currentMap[address] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            updated = true;
          } else if (active) {
            currentMap[address] = [0, 0]; // Mark resolved but strictly not found globally
            updated = true;
          }
        } catch {
          if (active) {
            currentMap[address] = [0, 0];
            updated = true;
          }
        }

        if (updated && active) {
          setGeoMap({ ...currentMap });
        }
        
        if (active) await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    if (deliveryPoints.length > 0) {
      fetchCoords();
    }

    return () => { active = false; };
  }, [deliveryPoints, vehicles]);

  // Build route data for each in-transit order
  const routes = inTransitOrders.map(order => {
    const from = getCoords(order.placeOfDeparture);
    const to = LVIV; // Destination always the Lviv hub (can be improved with API data)
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
        zoom={12}
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

        {/* Delivery Points markers */}
        {deliveryPoints.map((dp) => (
          <Marker key={dp.id} position={getDeliveryPointCoords(dp, geoMap)} icon={getPointIcon(dp.type)}>
            <Tooltip direction="top" offset={[0, -16]} opacity={1} className="glass-tooltip">
              <div style={{ minWidth: '180px' }}>
                <div className="glass-tooltip-title">{dp.name}</div>
                <span className="glass-tooltip-type">{dp.type.replace('_', ' ')}</span>
                
                {inventoryMap?.get(dp.id)?.length ? (
                  <>
                    <div className="glass-tooltip-divider" />
                    <ul className="glass-tooltip-list">
                      {inventoryMap.get(dp.id)!.slice(0, 5).map(p => (
                        <li key={p.id}>
                          {p.name} <span>({(p.weight / 1000).toFixed(1)} kg)</span>
                        </li>
                      ))}
                      {inventoryMap.get(dp.id)!.length > 5 && (
                        <li>+ {inventoryMap.get(dp.id)!.length - 5} items hidden</li>
                      )}
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="glass-tooltip-divider" />
                    <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>No inventory logged</div>
                  </>
                )}
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Vehicles Markers */}
        {vehicles.map((v) => (
          <Marker key={v.id} position={getAddressCoords(v.address, v.id, geoMap)} icon={getPointIcon('vehicle')}>
            <Tooltip direction="top" offset={[0, -16]} opacity={1} className="glass-tooltip">
              <div style={{ minWidth: '160px' }}>
                <div className="glass-tooltip-title">{v.name}</div>
                <span className="glass-tooltip-type">Delivery Vehicle</span>
                <div className="glass-tooltip-divider" />
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <b>Fuel:</b> <span style={{ textTransform: 'capitalize' }}>{v.fuel_type}</span><br />
                  <b>Limit:</b> {(v.max_weight / 1000).toFixed(1)} kg<br />
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                    Vol: {(v.max_length/100 * v.max_width/100 * v.max_height/100).toFixed(1)} m³
                  </span>
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* In-Transit routes */}
        {routes.map(({ order, waypoints, truckIdx }) => (
          <span key={order.id}>
            {/* Dashed path */}
            <Polyline
              positions={waypoints}
              pathOptions={{
                color: '#a855f7',
                weight: 2.5,
                opacity: 0.85,
                dashArray: '10, 8',
                lineCap: 'round',
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

