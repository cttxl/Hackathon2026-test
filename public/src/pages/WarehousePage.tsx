import { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { Header } from '../components/Shared/Header';
import { WarehouseSelector } from '../components/Warehouse/WarehouseSelector';
import { InventoryList } from '../components/Warehouse/InventoryList';
import { OperationsQueue } from '../components/Warehouse/OperationsQueue';
import {
  getDeliveryPoints,
  getSkus,
  getRequests,
  getArrivals,
  patchArrival,
  patchRequest,
  getEmployees,
  getVehicles
} from '../services/api';
import { ApiDeliveryPoint, ApiSku, ApiArrival, ApiRequest, Order, ApiEmployee, ApiVehicle } from '../types/api';
import './WarehousePage.css';
import './AdminPage.css'; // Global dashboard styles

const API_TO_UI_STATUS: Record<string, any> = {
  pending: 'Pending',
  accepted: 'Accepted',
  shipped: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Canceled',
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Warehouse component crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', margin: '20px', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px' }}>
          <h2>Warehouse Dashboard Crashed</h2>
          <pre style={{ marginTop: '12px', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

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

export function WarehousePage() {
  const [warehouses, setWarehouses] = useState<ApiDeliveryPoint[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  const [skus, setSkus] = useState<ApiSku[]>([]);
  const [arrivals, setArrivals] = useState<ApiArrival[]>([]);
  const [requests, setRequests] = useState<ApiRequest[]>([]);

  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOps, setLoadingOps] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Load All Warehouses ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await getDeliveryPoints('warehouse');
        const data = res?.data || [];
        setWarehouses(data);
        if (data.length > 0) {
          setSelectedWarehouseId(data[0].id);
        }
      } catch (err) {
        console.error("Warehouse fetch error:", err);
        setApiError('Failed to fetch warehouses. API might be offline.');
        setWarehouses([]);
      }
    };
    fetchWarehouses();
  }, []);

  // ── Load Data for Selected Warehouse ──────────────────────────────────────
  const loadWarehouseData = useCallback(async () => {
    if (!selectedWarehouseId) return;

    setLoadingOps(true);
    try {
      const [skuRes, arrivalRes, requestRes, empRes, vehRes] = await Promise.all([
        getSkus(selectedWarehouseId),
        getArrivals(), // Showing all arrivals for now
        getRequests({ delivery_point_id: selectedWarehouseId }),
        getEmployees(1, 200),
        getVehicles()
      ]);

      setSkus(skuRes.data || []);
      setArrivals(arrivalRes.data || []);
      setRequests(requestRes.data || []);
      setEmployees(empRes.data || []);
      setVehicles(vehRes.data || []);
    } catch (err) {
      console.error("Warehouse sync error:", err);
      setApiError('Failed to sync warehouse data.');
      // Safety: ensure data is never null
      setSkus([]);
      setArrivals([]);
      setRequests([]);
      setEmployees([]);
      setVehicles([]);
    } finally {
      setLoading(false);
      setLoadingOps(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    loadWarehouseData();
  }, [selectedWarehouseId, loadWarehouseData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAcceptArrival = async (id: string) => {
    try {
      await patchArrival(id, { status: 'delivered' });
      await loadWarehouseData();
    } catch (err) {
      alert('Failed to update arrival status.');
    }
  };

  const handleShipRequest = async (id: string) => {
    try {
      await patchRequest(id, { status: 'shipped' });
      await loadWarehouseData();
    } catch (err) {
      alert('Failed to update request status.');
    }
  };

  // Build the orders
  const safeVehicles = vehicles || [];
  const vehicleMap = new Map<string, string>();
  safeVehicles.forEach(v => vehicleMap.set(v.id, v.name));

  const safeEmployees = employees || [];
  const driverMap = new Map<string, string>();
  safeEmployees.forEach(e => driverMap.set(e.id, e.fullname));

  const safeArrivals = arrivals || [];
  const orders: Order[] = safeArrivals.map((arr, idx) => toOrder(arr, vehicleMap, driverMap, idx));

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', background: '#0f172a', minHeight: '100vh' }}>
        <Header title="Warehouse Dashboard" />
        <div style={{ marginTop: '100px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <h3>Loading Warehouse Data...</h3>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="warehouse-dashboard-container">
        <Header title="Warehouse Dashboard" />

        <div className="warehouse-header-row">
          <WarehouseSelector
            warehouses={warehouses || []}
            selectedId={selectedWarehouseId}
            onSelect={setSelectedWarehouseId}
            loading={loading && (warehouses?.length || 0) === 0}
          />

          {apiError && (
            <div style={{ color: '#fde047', fontSize: '13px', background: 'rgba(234,179,8,0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.3)' }}>
              ⚠ {apiError}
            </div>
          )}
        </div>

        <div className="warehouse-split-layout">
          {!loading && (warehouses?.length || 0) === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', width: '100%', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <h3>No active warehouse data</h3>
              <p style={{ marginTop: '8px', opacity: 0.7 }}>Please ensure warehouses have been created in the system.</p>
            </div>
          ) : (
            <>
              <InventoryList
                skus={skus || []}
                loading={loading}
              />

              <OperationsQueue
                orders={orders || []}
                requests={requests || []}
                onAcceptArrival={handleAcceptArrival}
                onShipRequest={handleShipRequest}
                loading={loadingOps}
              />
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
