import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Shared/Header';
import { DriverMapWidget } from '../components/Driver/DriverMapWidget';
import { getArrivals, getVehicles, getEmployees, patchArrival } from '../services/api';
import { initialOrders } from '../data/mockOrders';
import './AdminPage.css';
import './LogistPage.css';

// ── Driver order type ────────────────────────────────────────────────────────
export interface DriverOrder {
  id:            string;
  transportName: string;
  departure:     string;
  destination:   string;
  eta:           string;
  status:        string;
  completed:     boolean;
}

// ── Status → badge CSS ───────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  'Pending':    'badge-pending',
  'Accepted':   'badge-accepted',
  'In Transit': 'badge-intransit',
  'Delivered':  'badge-delivered',
  'Canceled':   'badge-canceled',
};

const API_STATUS_MAP: Record<string, string> = {
  pending:   'Pending',
  accepted:  'Accepted',
  shipped:   'In Transit',
  delivered: 'Delivered',
  cancelled: 'Canceled',
};

// ── Mock fallback orders for the driver ─────────────────────────────────────
function buildMockDriverOrders(): DriverOrder[] {
  const warehouses = [
    'Central Hub Lviv',
    'Kyiv North Node',
    'Odesa Port Warehouse',
    'Dnipro Logistics Center',
    'Warsaw Relay Point',
  ];
  return initialOrders
    .filter(o => o.status === 'In Transit' || o.status === 'Accepted')
    .map((o, i) => ({
      id:            o.id,
      transportName: o.transportName,
      departure:     o.placeOfDeparture,
      destination:   warehouses[(i + 1) % warehouses.length],
      eta:           o.timeOfArrival,
      status:        o.status,
      completed:     false,
    }));
}

// ── Component ────────────────────────────────────────────────────────────────
export function DriverPage() {
  const [orders,   setOrders]   = useState<DriverOrder[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Derive current driver ID from the stored session
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') ?? '{}'); }
    catch { return {}; }
  })();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [arrivalsRes, vehiclesRes, employeesRes] = await Promise.all([
        getArrivals(),
        getVehicles(),
        getEmployees(1, 200),
      ]);

      const vehicleMap: Record<string, string>  = {};
      vehiclesRes.data.forEach(v => { vehicleMap[v.id] = v.name; });

      const driverMap: Record<string, string>   = {};
      employeesRes.data.forEach(e => { driverMap[e.id] = e.fullname; });

      // Filter to only this driver's arrivals
      const myArrivals = arrivalsRes.data.filter(
        a => a.driver_id === currentUser.id
      );

      if (myArrivals.length === 0) {
        // No personal arrivals found — show all (useful for demo)
        const all = arrivalsRes.data.slice(0, 5);
        setOrders(all.map((a) => ({
          id:            a.id,
          transportName: vehicleMap[a.transport_id] ?? a.transport_id,
          departure:     'Central Hub Lviv',
          destination:   'Lviv Hub',
          eta:           a.time_to_arrival
            ? new Date(a.time_to_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—',
          status:        API_STATUS_MAP[a.status] ?? a.status,
          completed:     a.status === 'delivered',
        })));
      } else {
        setOrders(myArrivals.map((a) => ({
          id:            a.id,
          transportName: vehicleMap[a.transport_id] ?? a.transport_id,
          departure:     'Central Hub Lviv',
          destination:   'Lviv Hub',
          eta:           a.time_to_arrival
            ? new Date(a.time_to_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—',
          status:        API_STATUS_MAP[a.status] ?? a.status,
          completed:     a.status === 'delivered',
        })));
      }
    } catch {
      setApiError('Using offline mock data — API not reachable.');
      setOrders(buildMockDriverOrders());
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // "Complete" — mark as delivered and clear from map
  const handleComplete = async (orderId: string) => {
    try {
      await patchArrival(orderId, { status: 'delivered' });
    } catch {
      // offline — just update local state
    }
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, completed: true, status: 'Delivered' } : o)
    );
  };

  const activeOrders    = orders.filter(o => !o.completed);
  const completedOrders = orders.filter(o => o.completed);

  return (
    <div className="admin-dashboard-container">
      <Header title="Driver Dashboard" />

      {apiError && (
        <div style={{
          background: 'rgba(234,179,8,0.15)',
          border: '1px solid rgba(234,179,8,0.4)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '12px',
          color: '#fde047',
          fontSize: '14px',
          flexShrink: 0,
        }}>
          ⚠ {apiError}
        </div>
      )}

      <div className="logist-split-layout">

        {/* ── Left: Map ── */}
        <div className="map-panel">
          <DriverMapWidget orders={orders} />
        </div>

        {/* ── Right: Order list ── */}
        <div className="orders-panel">
          <div className="panel-header">
            <h3 className="panel-title">My Orders</h3>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>
              {activeOrders.length} active
            </span>
          </div>

          {loading ? (
            <div style={{ color: '#fff', opacity: 0.5, textAlign: 'center', paddingTop: '40px' }}>
              Loading your orders…
            </div>
          ) : (
            <div className="order-list-container">

              {activeOrders.length === 0 && (
                <div style={{ color: '#94a3b8', textAlign: 'center', paddingTop: '40px', opacity: 0.7 }}>
                  No active orders. Well done! 🎉
                </div>
              )}

              {/* Active orders */}
              {activeOrders.map(order => (
                <div
                  key={order.id}
                  className={`order-card ${order.status === 'In Transit' ? 'status-intransit' : 'status-accepted'}`}
                >
                  <div className="order-info">
                    <span className="order-title">
                      {order.transportName}
                      <span style={{ opacity: 0.5 }}> | #{order.id}</span>
                    </span>

                    {/* Transit path */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {/* Origin */}
                      <span style={{
                        background: 'rgba(56,189,248,0.15)',
                        border: '1px solid rgba(56,189,248,0.4)',
                        color: '#38bdf8',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}>
                        📦 {order.departure}
                      </span>

                      {/* Dashed connector */}
                      <span style={{ color: '#94a3b8', fontSize: '16px', letterSpacing: '2px' }}>
                        - - - →
                      </span>

                      {/* Destination */}
                      <span style={{
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.4)',
                        color: '#22c55e',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}>
                        🏁 {order.destination}
                      </span>
                    </div>

                    <span className="order-sub" style={{ marginTop: '4px' }}>
                      ETA: <strong style={{ color: '#f1f5f9' }}>{order.eta}</strong>
                    </span>

                    <div>
                      <span className={`status-badge ${STATUS_BADGE[order.status] ?? 'badge-pending'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Complete button */}
                  <button
                    className="btn-edit"
                    style={{
                      background: 'rgba(34,197,94,0.2)',
                      borderColor: 'rgba(34,197,94,0.5)',
                      color: '#86efac',
                      fontWeight: 700,
                      padding: '10px 18px',
                    }}
                    onClick={() => handleComplete(order.id)}
                  >
                    ✓ Complete
                  </button>
                </div>
              ))}

              {/* Completed orders section */}
              {completedOrders.length > 0 && (
                <>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '12px 0 4px',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    marginTop: '8px',
                  }}>
                    COMPLETED ({completedOrders.length})
                  </div>
                  {completedOrders.map(order => (
                    <div
                      key={order.id}
                      className="order-card status-delivered"
                      style={{ opacity: 0.5 }}
                    >
                      <div className="order-info">
                        <span className="order-title" style={{ textDecoration: 'line-through' }}>
                          {order.transportName}
                          <span style={{ opacity: 0.5 }}> | #{order.id}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{order.departure}</span>
                          <span style={{ color: '#94a3b8' }}>→</span>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{order.destination}</span>
                        </div>
                        <div>
                          <span className="status-badge badge-delivered">Delivered</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
