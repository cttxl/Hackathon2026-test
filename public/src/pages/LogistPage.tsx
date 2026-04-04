import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '../components/Shared/Header';
import { MapWidget } from '../components/Logist/MapWidget';
import { OrderList } from '../components/Logist/OrderList';
import { EditOrderModal } from '../components/Logist/EditOrderModal';
import { PriorityModal } from '../components/Logist/PriorityModal';
import { ProductsModal } from '../components/Logist/ProductsModal';
import {
  getArrivals,
  createArrival,
  patchArrival,
  getEmployees,
  getVehicles,
} from '../services/api';
import type { ApiArrival, ApiVehicle, ApiEmployee, Order, OrderStatus } from '../types/api';
import './LogistPage.css';
import './AdminPage.css';



// ── Status mappings ───────────────────────────────────────────────────────────

const API_TO_UI_STATUS: Record<string, OrderStatus> = {
  pending: 'Pending',
  accepted: 'Accepted',
  shipped: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Canceled',
};

export const UI_TO_API_STATUS: Record<OrderStatus, string> = {
  Pending: 'pending',
  Accepted: 'accepted',
  'In Transit': 'shipped',
  Delivered: 'delivered',
  Canceled: 'cancelled',
};

// ── Adapter: ApiArrival → Order ───────────────────────────────────────────────

function toOrder(
  arrival: ApiArrival,
  vehicleMap: Map<string, string>,
  driverMap: Map<string, string>,
  index: number,
): Order {
  return {
    id: arrival.id,
    transportName: vehicleMap.get(arrival.transport_id) ?? arrival.transport_id,
    driverName: driverMap.get(arrival.driver_id) ?? arrival.driver_id,
    placeOfDeparture: 'N/A',
    timeToDeparture: 'N/A',
    timeOfArrival: arrival.time_to_arrival
      ? new Date(arrival.time_to_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '—',
    status: API_TO_UI_STATUS[arrival.status] ?? 'Pending',
    priority: index + 1,
    _raw: arrival,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LogistPage() {
  // ── Raw API data ──────────────────────────────────────────────────────────
  const [arrivals, setArrivals] = useState<ApiArrival[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Map<string, number>>(new Map());

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [selectedArrivalId, setSelectedArrivalId] = useState<string | null>(null);
  const [productsArrivalId, setProductsArrivalId] = useState<string | null>(null);

  const vehicleMap = useMemo<Map<string, string>>(() => {
    const m = new Map<string, string>();
    (vehicles || []).forEach(v => m.set(v.id, v.name));
    return m;
  }, [vehicles]);

  const driverMap = useMemo<Map<string, string>>(() => {
    const m = new Map<string, string>();
    (employees || []).forEach(e => m.set(e.id, e.fullname));
    return m;
  }, [employees]);

  // ── Derived order list (memoised) ─────────────────────────────────────────
  const orders = useMemo<Order[]>(() => {
    return (arrivals || []).map((arrival, idx) => {
      const order = toOrder(arrival, vehicleMap, driverMap, idx);
      // Apply any user-reordered priorities
      const overridePriority = priorities.get(arrival.id);
      return overridePriority !== undefined
        ? { ...order, priority: overridePriority }
        : order;
    });
  }, [arrivals, vehicleMap, driverMap, priorities]);

  const selectedOrder = useMemo(
    () => orders.find(o => o.id === selectedArrivalId) ?? null,
    [orders, selectedArrivalId],
  );

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [arrivalsRes, vehiclesRes, employeesRes] = await Promise.all([
        getArrivals(),
        getVehicles(),
        getEmployees(1, 200),
      ]);
      setArrivals(arrivalsRes?.data || []);
      setVehicles(vehiclesRes?.data || []);
      setEmployees(employeesRes?.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data.';
      setApiError(msg);
      setArrivals([]);
      setVehicles([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddOrderClick = () => {
    setSelectedArrivalId(null);
    setIsEditModalOpen(true);
  };

  const handleEditOrderClick = (order: Order) => {
    setSelectedArrivalId(order.id);
    setIsEditModalOpen(true);
  };

  const handleProductsClick = (order: Order) => {
    setProductsArrivalId(order.id);
  };

  const handleSaveOrder = async (uiOrder: Order) => {
    try {
      if (selectedArrivalId) {
        // Editing existing arrival — patch status only (most common edit)
        await patchArrival(selectedArrivalId, {
          status: UI_TO_API_STATUS[uiOrder.status] as ApiArrival['status'],
        });
      } else {
        // Creating new arrival — use first available vehicle/driver or blank
        await createArrival({
          transport_id: uiOrder._raw?.transport_id ?? '',
          driver_id: uiOrder._raw?.driver_id ?? '',
          time_to_arrival: new Date().toISOString(),
        });
      }
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed.';
      setApiError(msg);
    }
    setIsEditModalOpen(false);
    setSelectedArrivalId(null);
  };

  const handleSavePriority = (reordered: Order[]) => {
    const newPriorities = new Map<string, number>();
    reordered.forEach((o, idx) => newPriorities.set(o.id, idx + 1));
    setPriorities(newPriorities);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', background: '#0f172a', minHeight: '100vh' }}>
        <Header title="Logist Dashboard" />
        <div style={{ marginTop: '100px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <h3>Loading Logistics Data...</h3>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-container">
      <Header title="Logist Dashboard" />

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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚠ {apiError}
          <button
            onClick={loadData}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#fca5a5',
              borderRadius: '6px',
              padding: '3px 10px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Retry
          </button>
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
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading arrivals…</span>
            </div>
          ) : apiError && !orders?.length ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <h3 style={{ marginBottom: '8px' }}>Please log in or try again</h3>
              <p style={{ opacity: 0.7 }}>We couldn't load the active orders.</p>
            </div>
          ) : !orders?.length ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <h3 style={{ marginBottom: '8px' }}>No active orders</h3>
              <p style={{ opacity: 0.7 }}>There are currently no orders in the system.</p>
            </div>
          ) : (
            <OrderList
              orders={orders || []}
              onEditClick={handleEditOrderClick}
              onProductsClick={handleProductsClick}
            />
          )}

          <div className="panel-footer">
            <button
              className="btn-secondary"
              onClick={() => setIsPriorityModalOpen(true)}
              style={{ width: '100%' }}
              disabled={loading || (orders?.length || 0) === 0}
            >
              ✎ Edit Priority
            </button>
          </div>
        </div>
      </div>

      <EditOrderModal
        isOpen={isEditModalOpen}
        order={selectedOrder}
        vehicles={vehicles || []}
        employees={(employees || []).filter(e => e.role === 'driver')}
        onClose={() => { setIsEditModalOpen(false); setSelectedArrivalId(null); }}
        onSave={handleSaveOrder}
      />

      <PriorityModal
        orders={[...(orders || [])].sort((a, b) => a.priority - b.priority)}
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
