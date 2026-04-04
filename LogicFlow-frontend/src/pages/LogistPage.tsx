import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Shared/Header';
import { MapWidget } from '../components/Logist/MapWidget';
import { OrderList } from '../components/Logist/OrderList';
import { EditOrderModal } from '../components/Logist/EditOrderModal';
import { PriorityModal } from '../components/Logist/PriorityModal';
import { ProductsModal } from '../components/Logist/ProductsModal';
import { Order, initialOrders } from '../data/mockOrders';
import {
  getArrivals,
  createArrival,
  patchArrival,
  getEmployees,
  getVehicles,
} from '../services/api';
import type { ApiArrival } from '../types/api';
import './LogistPage.css';
import './AdminPage.css';

// ── Status mapping ────────────────────────────────────────────────────────────
const API_STATUS_MAP: Record<string, Order['status']> = {
  pending:   'Pending',
  accepted:  'Accepted',
  shipped:   'In Transit',
  delivered: 'Delivered',
  cancelled: 'Canceled',
};
const UI_STATUS_MAP: Record<Order['status'], string> = {
  Pending:      'pending',
  Accepted:     'accepted',
  'In Transit': 'shipped',
  Delivered:    'delivered',
  Canceled:     'cancelled',
};

// ── API arrival → UI Order adapter ───────────────────────────────────────────
function apiToOrder(
  arrival: ApiArrival,
  vehicleMap: Record<string, string>,
  driverMap: Record<string, string>,
  idx: number
): Order {
  return {
    id:               arrival.id,
    transportName:    vehicleMap[arrival.transport_id] ?? arrival.transport_id,
    driverName:       driverMap[arrival.driver_id]    ?? arrival.driver_id,
    placeOfDeparture: 'N/A',
    timeToDeparture:  'N/A',
    timeOfArrival:    arrival.time_to_arrival
      ? new Date(arrival.time_to_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '—',
    status:           API_STATUS_MAP[arrival.status] ?? 'Pending',
    priority:         idx + 1,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LogistPage() {
  const [orders,             setOrders]             = useState<Order[]>(initialOrders);
  const [loading,            setLoading]            = useState(true);
  const [apiError,           setApiError]           = useState<string | null>(null);

  const [isEditModalOpen,    setIsEditModalOpen]    = useState(false);
  const [isPriorityModalOpen,setIsPriorityModalOpen]= useState(false);
  const [selectedOrder,      setSelectedOrder]      = useState<Order | null>(null);
  const [productsArrivalId,  setProductsArrivalId]  = useState<string | null>(null);

  // ── Load arrivals ──────────────────────────────────────────────────────
  const loadArrivals = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [arrivalsRes, vehiclesRes, employeesRes] = await Promise.all([
        getArrivals(),
        getVehicles(),
        getEmployees(1, 200),
      ]);

      const vehicleMap: Record<string, string> = {};
      vehiclesRes.data.forEach(v => { vehicleMap[v.id] = v.name; });

      const driverMap: Record<string, string> = {};
      employeesRes.data.forEach(e => { driverMap[e.id] = e.fullname; });

      const mapped = arrivalsRes.data.map((a, i) =>
        apiToOrder(a, vehicleMap, driverMap, i)
      );
      setOrders(mapped.length > 0 ? mapped : initialOrders);
    } catch {
      setOrders(initialOrders);
      setApiError('Using offline mock data — API not reachable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadArrivals(); }, [loadArrivals]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleAddOrderClick = () => { setSelectedOrder(null); setIsEditModalOpen(true); };
  const handleEditOrderClick = (order: Order) => { setSelectedOrder(order); setIsEditModalOpen(true); };
  const handleProductsClick = (order: Order) => { setProductsArrivalId(order.id); };

  const handleSaveOrder = async (uiOrder: Order) => {
    try {
      if (selectedOrder) {
        await patchArrival(uiOrder.id, {
          status: UI_STATUS_MAP[uiOrder.status] as ApiArrival['status'],
        });
      } else {
        await createArrival({
          transport_id:    '',   // user must select via vehicle id — simplified for now
          driver_id:       '',   // same
          time_to_arrival: new Date().toISOString(),
        });
      }
      await loadArrivals();
    } catch {
      // Offline fallback
      if (selectedOrder) {
        setOrders(prev => prev.map(o => o.id === uiOrder.id ? uiOrder : o));
      } else {
        setOrders(prev => [...prev, { ...uiOrder, id: Date.now().toString() }]);
      }
    }
    setIsEditModalOpen(false);
  };

  const handleSavePriority = (newOrders: Order[]) => setOrders(newOrders);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-container">
      <Header title="Logist Dashboard" />

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

        {/* Left — Map */}
        <div className="map-panel">
          <MapWidget orders={orders} />
        </div>

        {/* Right — Orders */}
        <div className="orders-panel">
          <div className="panel-header">
            <h3 className="panel-title">Active Orders</h3>
            <button className="btn-primary" onClick={handleAddOrderClick}>
              Add Order
            </button>
          </div>

          {loading ? (
            <div style={{ color: '#fff', opacity: 0.5, textAlign: 'center', paddingTop: '40px' }}>
              Loading orders…
            </div>
          ) : (
            <OrderList
              orders={orders}
              onEditClick={handleEditOrderClick}
              onProductsClick={handleProductsClick}
            />
          )}

          <div className="panel-footer">
            <button
              className="btn-secondary"
              onClick={() => setIsPriorityModalOpen(true)}
              style={{ width: '100%' }}
            >
              ✎ Edit Priority
            </button>
          </div>
        </div>
      </div>

      <EditOrderModal
        isOpen={isEditModalOpen}
        order={selectedOrder}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveOrder}
      />

      <PriorityModal
        orders={[...orders].sort((a, b) => a.priority - b.priority)}
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        onSavePriority={handleSavePriority}
      />

      <ProductsModal
        arrivalId={productsArrivalId}
        isOpen={productsArrivalId !== null}
        onClose={() => setProductsArrivalId(null)}
      />
    </div>
  );
}
