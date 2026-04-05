import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '../components/Shared/Header';
import { MapWidget } from '../components/Logist/MapWidget';
import { OrderList } from '../components/Logist/OrderList';
import { EditOrderModal } from '../components/Logist/EditOrderModal';
import { ProductsModal } from '../components/Logist/ProductsModal';
import { RequestList } from '../components/Logist/RequestList';
import {
  getArrivals,
  createArrival,
  patchArrival,
  getEmployees,
  getVehicles,
  getDeliveryPoints,
  getProducts,
  getSkus,
  getRequests,
  getRecommendedArrivalRequests,
  createArrivalRequest,
} from '../services/api';
import type { ApiArrival, ApiVehicle, ApiEmployee, ApiDeliveryPoint, ApiProduct, ApiRequest, Order, OrderStatus } from '../types/api';
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
    _raw: arrival,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LogistPage() {
  // ── Raw API data ──────────────────────────────────────────────────────────
  const [arrivals, setArrivals] = useState<ApiArrival[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [deliveryPoints, setDeliveryPoints] = useState<ApiDeliveryPoint[]>([]);
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, ApiProduct[]>>(new Map());

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    return (arrivals || []).map((arrival) => {
      return toOrder(arrival, vehicleMap, driverMap);
    });
  }, [arrivals, vehicleMap, driverMap]);

  const selectedOrder = useMemo(
    () => orders.find(o => o.id === selectedArrivalId) ?? null,
    [orders, selectedArrivalId],
  );

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [arrivalsRes, vehiclesRes, employeesRes, dpRes, prodRes, requestsRes] = await Promise.all([
        getArrivals(),
        getVehicles(1, 100),
        getEmployees(1, 200),
        getDeliveryPoints(),
        getProducts(),
        getRequests(),
      ]);
      
      const dps = dpRes?.data || [];
      const prods = prodRes?.data || [];

      // Set map points INSTANTLY so they don't 'disappear at first'
      setArrivals(arrivalsRes?.data || []);
      setVehicles(vehiclesRes?.data || []);
      setEmployees(employeesRes?.data || []);
      setDeliveryPoints(dps);
      setAllProducts(prods);
      setRequests(requestsRes?.data || []);
      
      // Fetch SKUs asynchronously without blocking rendering
      Promise.all(
        dps.map(dp => getSkus(dp.id).then(res => ({ pointId: dp.id, skus: res?.data || [] })))
      ).then(skusArray => {
        const pMap = new Map(prods.map(p => [p.id, p]));
        const nextInvMap = new Map<string, ApiProduct[]>();
        
        skusArray.forEach(({ pointId, skus }) => {
          const dpProducts = skus.map(s => pMap.get(s.product_id)).filter(Boolean) as ApiProduct[];
          nextInvMap.set(pointId, dpProducts);
        });
        setInventoryMap(nextInvMap);
      }).catch(err => {
        console.error('Failed to load internal SKU inventories', err);
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data.';
      setApiError(msg);
      setArrivals([]);
      setVehicles([]);
      setEmployees([]);
      setDeliveryPoints([]);
      setRequests([]);
      setInventoryMap(new Map());
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
  
  const handleAutoSort = async () => {
    try {
      setLoading(true);
      const recommendedRes = await getRecommendedArrivalRequests();
      const recommended = recommendedRes?.data || [];
      
      // We process them in parallel.
      await Promise.all(recommended.map(async item => {
        // 1. Create the dispatch mapping
        await createArrivalRequest({
          arrival_id: item.arrival_id,
          request_id: item.request_id,
          sku_ids: item.sku_ids || [],
          priority: item.priority
        });
      }));
      
      await loadData();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Auto-sort failed');
    } finally {
      setLoading(false);
    }
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
        {/* Top Row: Map and Orders */}
        <div className="logist-top-row">
          {/* Left — Map */}
          <div className="map-panel">
            <MapWidget orders={orders} deliveryPoints={deliveryPoints} inventoryMap={inventoryMap} vehicles={vehicles} />
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
          </div>
        </div>

        {/* Bottom Row: All Requests */}
        <div className="orders-panel requests-full-width">
          <div className="panel-header">
            <h3 className="panel-title">All Requests (SKU) — {requests?.length || 0}</h3>
            <button className="btn-secondary" onClick={handleAutoSort} disabled={loading} style={{ marginLeft: 'auto' }}>
              AUTO SORT
            </button>
          </div>

          <RequestList 
            requests={requests} 
            products={allProducts} 
            deliveryPoints={deliveryPoints} 
          />
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

      <ProductsModal
        arrivalId={productsArrivalId}
        isOpen={productsArrivalId !== null}
        onClose={() => setProductsArrivalId(null)}
      />
    </div>
  );
}
