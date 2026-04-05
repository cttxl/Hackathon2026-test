import { useEffect, useRef, Fragment } from 'react';
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
    border:2px solid rgba(255,255,255,0.2);
    box-shadow:0 0 8px rgba(56,189,248,0.5);
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
    border:1px solid rgba(255,255,255,0.3);
    box-shadow:0 0 6px rgba(168,85,247,0.5);
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  popupAnchor: [0, -8],
});

const truckIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:24px;height:24px;
    background:rgba(168,85,247,0.85);
    border-radius:50%;
    border:1px solid rgba(255,255,255,0.1);
    box-shadow:0 4px 12px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;line-height:1;
  ">🚛</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const destIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:#22c55e;
    border-radius:50%;
    border:1px solid rgba(255,255,255,0.1);
    box-shadow:0 0 10px rgba(34,197,94,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

function getPointIcon(type: string, isSmall = false) {
  let emoji = '';
  let size = 16;

  if (type === 'warehouse') {
    emoji = '🏠';
    size = 20;
  } else if (type === 'client_point') {
    emoji = '📍';
    size = 18;
  } else if (type === 'provider') {
    emoji = '🏭';
    size = 20;
  } else if (type === 'vehicle') {
    emoji = '🚚';
    size = isSmall ? 16 : 24;
  }

  const finalSize = Math.round(isSmall ? size * 0.8 : size);

  if (emoji) {
    return L.divIcon({
      className: '',
      html: `<div style="
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${finalSize}px;
        line-height: ${finalSize}px;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        opacity: ${isSmall ? 0.7 : 1};
      ">${emoji}</div>`,
      iconSize: [finalSize, finalSize],
      iconAnchor: [Math.floor(finalSize/2), Math.floor(finalSize/2)],
    });
  }

  // Fallback simple dot
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;
      background:#f59e0b;
      border-radius:3px;
      border:1px solid rgba(255,255,255,0.3);
      box-shadow:0 0 8px #f59e0b;
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
  
  // Addresses
  'вул. Тестова, 1, Львів': [49.8350, 24.0300],
  'вул. Шевченка, 317, Львів': [49.8524, 23.9613],
  'вул. Городоцька, 355, Львів': [49.8188, 23.9472],
  'вул. Зелена, 153, Львів': [49.8143, 24.0534],
  'вул. Джорджа Вашингтона, 8': [49.8213, 24.0673],
  'вул. Стрийська, 45': [49.8055, 24.0182],

  // Names (Fallback for warehouses)
  'Склад Рясне-Пром': [49.8524, 23.9613],
  'Логістичний центр Захід': [49.8188, 23.9472],
  'Склад Сихів-Термінал': [49.8143, 24.0534],
};

const LVIV: [number, number] = [49.8397, 24.0297];

function getAddressCoords(address: string | undefined, seedStr: string, isStaticVehicle = false): [number, number] {
  if (!address) return LVIV;
  if (KNOWN_COORDS[address]) return KNOWN_COORDS[address];

  // Deterministic fallback
  const seed = seedStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  // Static vehicles get a larger spread (jitter) to avoid overlapping warehouses
  const spread = isStaticVehicle ? 200 : 100;
  const latOffset = ((seed * 13) % 200 - 100) / (spread * 10.0);
  const lngOffset = ((seed * 17) % 200 - 100) / (spread * 10.0);
  
  return [49.8397 + latOffset, 24.0297 + lngOffset];
}

function getDeliveryPointCoords(dp: ApiDeliveryPoint): [number, number] {
  if (dp.name && KNOWN_COORDS[dp.name]) return KNOWN_COORDS[dp.name];
  return getAddressCoords(dp.address, dp.id || dp.name || 'fallback');
}

/** Generate realistic intermediate waypoints between two coordinates */
function buildWaypoints(
  from: [number, number],
  to: [number, number],
  orderId: string
): [number, number][] {
  const seed = orderId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const jitter = (i: number) => ((seed * (i + 1) * 17) % 100 - 50) / 5000;

  const steps = 4;
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
function FitEverything({ routes, points }: { routes: [number, number][][], points: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    
    const allCoords = [...routes.flat(), ...points].filter(c => c && Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && c[0] !== 0);
    if (allCoords.length === 0) return;

    try {
      const bounds = L.latLngBounds(allCoords.map(c => L.latLng(c[0], c[1])));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        fitted.current = true;
      }
    } catch (e) {
      console.warn("FitEverything failed:", e);
    }
  }, [routes, points, map]);

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
  
  const routes = inTransitOrders.map((order, idx) => {
    const fromAddr = order.placeOfDeparture || 'Lviv Hub';
    const toAddrId = (order._raw as any)?.delivery_point_id || ''; 

    // Find destination DP to get its real address
    const destDP = deliveryPoints.find(dp => dp.id === toAddrId);
    
    const fromCoords = getAddressCoords(fromAddr, 'origin-' + order.id);
    const toCoords = destDP ? getDeliveryPointCoords(destDP) : getAddressCoords(toAddrId, 'dest-' + order.id);

    return {
      order,
      waypoints: buildWaypoints(fromCoords, toCoords, order.id),
      truckIdx: idx % 10,
    };
  });

  // Deduplicate: Don't show static markers for vehicles currently on active routes
  const activeVehicleNames = new Set(inTransitOrders.map(o => o.transportName));
  const staticVehicles = vehicles.filter(v => !activeVehicleNames.has(v.name));

  const allWaypoints = routes.map(r => r.waypoints);
  const dpCoords = deliveryPoints.map(dp => getDeliveryPointCoords(dp));

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

        <FitEverything routes={allWaypoints} points={[...dpCoords, ...staticVehicles.map(v => getAddressCoords(v.address, v.id, true))]} />

        {/* Delivery Points markers */}
        {deliveryPoints.map((dp) => (
          <Marker 
            key={dp.id} 
            position={getDeliveryPointCoords(dp)} 
            icon={getPointIcon(dp.type)}
            zIndexOffset={dp.type === 'warehouse' ? 1000 : 500}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -16]} 
              opacity={1} 
              className="glass-tooltip"
              permanent={false}
            >
              <div style={{ minWidth: '180px' }}>
                <div className="glass-tooltip-title">{dp.name}</div>
                <div className="glass-tooltip-type">
                  {dp.type === 'warehouse' ? '🏠 Warehouse' : dp.type === 'provider' ? '🏭 Provider' : '📍 Delivery Point'}
                </div>
                {dp.address && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {dp.address}
                  </div>
                )}
                <div className="glass-tooltip-divider" />
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                  Inventory:
                </div>
                <ul className="glass-tooltip-list">
                  {(inventoryMap?.get(dp.id) || []).slice(0, 5).map((prod, idx) => (
                    <li key={idx}>
                      {prod.name} <span>({(prod.weight / 1000).toFixed(1)}kg)</span>
                    </li>
                  ))}
                  {(!inventoryMap?.has(dp.id) || (inventoryMap.get(dp.id)?.length === 0)) && (
                    <li style={{ fontStyle: 'italic', opacity: 0.5 }}>Empty</li>
                  )}
                  {(inventoryMap?.get(dp.id)?.length || 0) > 5 && (
                    <li style={{ listStyle: 'none', marginTop: '4px', opacity: 0.7 }}>
                      + {(inventoryMap?.get(dp.id)?.length || 0) - 5} more items...
                    </li>
                  )}
                </ul>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Vehicles Markers (All fleet, small) */}
        {vehicles.map((v) => (
          <Marker 
            key={v.id} 
            position={getAddressCoords(v.address, v.id, true)} 
            icon={getPointIcon('vehicle', true)}
            zIndexOffset={100}
          >
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
          <Fragment key={order.id}>
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
          </Fragment>
        ))}
      </MapContainer>
    </div>
  );
}

