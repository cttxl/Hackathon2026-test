import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';
import { Header } from '../components/Shared/Header';
import { MapWidget } from '../components/Shared/MapWidget';
import { getArrivals, getVehicles, patchArrival, getDeliveryPoints, getArrivalRequests, getRequests, patchRequest } from '../services/api';
import type { Order, ApiDeliveryPoint, ApiVehicle } from '../types/api';
import './AdminPage.css';
import './LogistPage.css';
import './DriverPage.css';

// ── Status → badge CSS ───────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  'Pending': 'badge-pending',
  'Accepted': 'badge-accepted',
  'In Transit': 'badge-intransit',
  'Delivered': 'badge-delivered',
  'Canceled': 'badge-canceled',
};

const API_STATUS_MAP: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  shipped: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Canceled',
};

// ── Component ────────────────────────────────────────────────────────────────
export function DriverPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPoints, setDeliveryPoints] = useState<ApiDeliveryPoint[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [deliveringPointId, setDeliveringPointId] = useState<string | null>(null);

  // Derive current driver ID from the stored session
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') ?? '{}'); }
    catch { return {}; }
  })();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [arrivalsRes, vehiclesRes, dpRes, requestsRes] = await Promise.all([
        getArrivals(),
        getVehicles(),
        getDeliveryPoints(),
        getRequests(),
      ]);

      const vehicleMap: Record<string, string> = {};
      const vehiclesData = vehiclesRes?.data || [];
      vehiclesData.forEach(v => { vehicleMap[v.id] = v.name; });
      setVehicles(vehiclesData);

      const dps = dpRes?.data || [];
      setDeliveryPoints(dps);
      const dpMap: Record<string, string> = {};
      dps.forEach(dp => { dpMap[dp.id] = dp.name; });

      const requestMap: Record<string, string> = {};
      (requestsRes?.data || []).forEach(r => { requestMap[r.id] = r.delivery_point_id; });

      // Filter to only this driver's arrivals
      const myArrivals = (arrivalsRes?.data || []).filter(
        a => a.driver_id === currentUser.id
      );

      // Fetch all arrival-requests for these arrivals to find destinations
      const allArRequests = await Promise.all(myArrivals.map(a => getArrivalRequests(a.id)));
      
      const requests = requestsRes?.data || [];
      const enrichedOrders = myArrivals.map((a, idx) => {
        const arData = allArRequests[idx].data || [];
        const requestIds = arData.map(r => r.request_id);
        const linkedRequests = requests.filter(r => requestIds.includes(r.id));
        
        let dpId = '';
        let destinationName = 'Lviv Hub';

        if (requestIds.length > 0) {
          dpId = requestMap[requestIds[0]] || '';
          destinationName = dpMap[dpId] || 'Assigned Point';
        }

        return {
          id: a.id,
          transportName: vehicleMap[a.transport_id] ?? a.transport_id,
          driverName: currentUser.fullname || 'Me',
          placeOfDeparture: 'Central Hub Lviv',
          timeToDeparture: 'Now',
          destination: destinationName,
          timeOfArrival: a.time_to_arrival
            ? new Date(a.time_to_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—',
          status: (API_STATUS_MAP[a.status] as any) ?? 'Pending',
          linkedRequests,
          _raw: { ...a, delivery_point_id: dpId } as any,
        };
      });

      setOrders(enrichedOrders);

    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to load driver orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, currentUser.fullname]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handlePointDelivery = async (pointId: string, order: Order) => {
    try {
      setDeliveringPointId(pointId);
      const targetRequests = order.linkedRequests?.filter(r => r.delivery_point_id === pointId && r.status !== 'delivered') || [];
      
      if (targetRequests.length === 0) return;

      await Promise.all(targetRequests.map(req => 
        patchRequest(req.id, { status: 'delivered' })
      ));

      await loadOrders();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update requests');
    } finally {
      setDeliveringPointId(null);
    }
  };

  const handleComplete = async (orderId: string) => {
    if (confirmingOrderId !== orderId) {
      setConfirmingOrderId(orderId);
      return;
    }

    try {
      await patchArrival(orderId, { status: 'delivered' });
      
      setOrders((prev: Order[]) =>
        prev.map((o: Order) => o.id === orderId ? { ...o, status: 'Delivered' } : o)
      );
      setConfirmingOrderId(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to complete order.');
      setConfirmingOrderId(null);
    }
  };

  const activeOrders = (orders || []).filter(o => o.status !== 'Delivered');
  const completedOrders = (orders || []).filter(o => o.status === 'Delivered');

  // ── Calculate delivered point IDs for map highlighting ─────────────────────
  const deliveredPointIds = activeOrders ? Array.from(new Set(
    activeOrders.flatMap(order => {
      const requestsByPoint = (order.linkedRequests || []).reduce((acc, req) => {
        const pid = req.delivery_point_id || '';
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(req);
        return acc;
      }, {} as Record<string, any[]>);

      return Object.entries(requestsByPoint)
        .filter(([_, reqs]) => reqs.length > 0 && reqs.every(r => r.status === 'delivered'))
        .map(([pid]) => pid);
    })
  )) : [];

  if (loading) {
    return <LoadingSpinner message="Loading Driver Schedule..." />;
  }

  return (
    <div className="admin-dashboard-container">
      <Header title="Driver Dashboard" />

      {apiError && (
        <div style={{
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '12px',
          color: '#fca5a5',
          fontSize: '14px',
          flexShrink: 0,
        }}>
          ⚠ {apiError}
        </div>
      )}

      <div className="logist-split-layout">
        <div className="logist-top-row">
          {/* ── Left: Map ── */}
          <div className="map-panel">
            <MapWidget 
              orders={orders} 
              deliveryPoints={deliveryPoints} 
              vehicles={vehicles}
              deliveredPointIds={deliveredPointIds}
            />
          </div>

          {/* ── Right: Order list ── */}
          <div className="orders-panel">
            <div className="panel-header">
              <h3 className="panel-title">My Orders</h3>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                {(activeOrders?.length || 0)} active
              </span>
            </div>

            <div className="order-list-container">
              {(activeOrders?.length || 0) === 0 && (
                <div style={{ color: '#94a3b8', textAlign: 'center', paddingTop: '40px', opacity: 0.7 }}>
                  No active orders. Well done! 🎉
                </div>
              )}

              {/* Active orders */}
              {activeOrders?.map(order => (
                <div
                  key={order.id}
                  className={`order-card ${order.status === 'In Transit' ? 'status-intransit' : 'status-accepted'}`}
                >
                  <div className="order-info">
                    <span className="order-title">
                      {order.transportName}
                      <span style={{ opacity: 0.5 }}> | #{order.id.slice(0, 8)}</span>
                    </span>

                    {/* Transit path */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(56,189,248,0.15)',
                        border: '1px solid rgba(56,189,248,0.4)',
                        color: '#38bdf8',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}>
                        📦 {order.placeOfDeparture}
                      </span>

                      <span style={{ color: '#94a3b8', fontSize: '16px', letterSpacing: '2px' }}>
                        - - - →
                      </span>

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
                      ETA: <strong style={{ color: '#f1f5f9' }}>{order.timeOfArrival}</strong>
                    </span>

                    <div>
                      <span className={`status-badge ${STATUS_BADGE[order.status] ?? 'badge-pending'}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Unique Delivery Points List */}
                    {(() => {
                      const uniqueDpIds = Array.from(new Set(order.linkedRequests?.map((r: any) => r.delivery_point_id) || []));
                      if (uniqueDpIds.length === 0) return null;
                      
                      return (
                        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                            Delivery Points ({uniqueDpIds.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {uniqueDpIds.map((dpId: any) => {
                              const dp = deliveryPoints.find((p: any) => p.id === dpId);
                              const isDelivering = deliveringPointId === dpId;
                              const allDelivered = order.linkedRequests?.filter(r => r.delivery_point_id === dpId).every(r => r.status === 'delivered');

                              return (
                                <div 
                                  key={dpId} 
                                  onClick={() => !allDelivered && handlePointDelivery(dpId, order)}
                                  style={{
                                    background: allDelivered ? 'rgba(34,197,94,0.1)' : 'rgba(56,189,248,0.1)',
                                    border: `1px solid ${allDelivered ? 'rgba(34,197,94,0.3)' : 'rgba(56,189,248,0.3)'}`,
                                    color: allDelivered ? '#86efac' : '#7dd3fc',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: allDelivered ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                    opacity: isDelivering ? 0.6 : 1,
                                    pointerEvents: isDelivering ? 'none' : 'auto',
                                  }}
                                  className={!allDelivered ? 'point-badge-interactive' : ''}
                                >
                                  {isDelivering ? '⏳' : allDelivered ? '✅' : '📍'} {dp?.name || 'Unknown Point'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    className="btn-edit"
                    style={{
                      background: confirmingOrderId === order.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34,197,94,0.2)',
                      borderColor: confirmingOrderId === order.id ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34,197,94,0.5)',
                      color: confirmingOrderId === order.id ? '#fca5a5' : '#86efac',
                      fontWeight: 700,
                      padding: '10px 18px',
                      minWidth: '120px',
                    }}
                    onClick={() => handleComplete(order.id)}
                  >
                    {confirmingOrderId === order.id ? 'Confirm?' : '✓ Complete'}
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
                    COMPLETED ({(completedOrders.length)})
                  </div>
                  {completedOrders.map((order: Order) => (
                    <div
                      key={order.id}
                      className="order-card status-delivered"
                      style={{ opacity: 0.5 }}
                    >
                      <div className="order-info">
                        <span className="order-title" style={{ textDecoration: 'line-through' }}>
                          {order.transportName}
                          <span style={{ opacity: 0.5 }}> | #{order.id.slice(0, 8)}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{order.placeOfDeparture}</span>
                          <span style={{ color: '#94a3b8' }}>→</span>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{order.destination}</span>
                        </div>
                        <div>
                          <span className="status-badge badge-delivered">Delivered</span>
                        </div>
                        
                        {(() => {
                          const uniqueDpIds = Array.from(new Set(order.linkedRequests?.map((r: any) => r.delivery_point_id) || []));
                          if (uniqueDpIds.length === 0) return null;
                          
                          return (
                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {uniqueDpIds.map((dpId: any) => {
                                  const dp = deliveryPoints.find((p: any) => p.id === dpId);
                                  return (
                                    <span key={dpId} style={{
                                      background: 'rgba(255,255,255,0.05)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      color: '#94a3b8',
                                    }}>
                                      📍 {dp?.name || 'Local Point'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
