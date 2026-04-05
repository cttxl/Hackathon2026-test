import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';
import { Header } from '../components/Shared/Header';
import { WarehouseSelector } from '../components/Warehouse/WarehouseSelector';
import { InventoryList } from '../components/Warehouse/InventoryList';
import { RequestsQueue } from '../components/Warehouse/RequestsQueue';
import {
  getDeliveryPoints,
  getSkus,
  patchRequest,
} from '../services/api';
import { ApiDeliveryPoint, ApiSku } from '../types/api';
import './WarehousePage.css';
import './AdminPage.css'; // Global dashboard styles



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


export function WarehousePage() {
  const [warehouses, setWarehouses] = useState<ApiDeliveryPoint[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [skus, setSkus] = useState<ApiSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [totalInventoryItems, setTotalInventoryItems] = useState(0);
  const [refreshRequestsKey, setRefreshRequestsKey] = useState(0);
  const pageSize = 10;

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
        console.error('Warehouse fetch error:', err);
        setApiError('Failed to fetch warehouses. API might be offline.');
        setWarehouses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  // ── Load SKUs for Selected Warehouse ──────────────────────────────────────
  useEffect(() => {
    if (!selectedWarehouseId) return;
    const fetchSkus = async () => {
      try {
        const res = await getSkus(selectedWarehouseId, inventoryPage, pageSize);
        setSkus(res?.data || []);
        setTotalInventoryItems(res?.meta?.total || 0);
      } catch (err) {
        console.error('SKU fetch error:', err);
        setSkus([]);
        setTotalInventoryItems(0);
      }
    };
    fetchSkus();
  }, [selectedWarehouseId, inventoryPage]);

  useEffect(() => {
    setInventoryPage(1);
  }, [selectedWarehouseId]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleShipRequest = async (id: string) => {
    try {
      await patchRequest(id, { status: 'delivered' });
      setRefreshRequestsKey(prev => prev + 1);
    } catch (err) {
      alert('Failed to update request status.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Warehouse Data..." />;
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
                currentPage={inventoryPage}
                pageSize={pageSize}
                totalItems={totalInventoryItems}
                onPageChange={setInventoryPage}
              />

              <RequestsQueue
                selectedWarehouseId={selectedWarehouseId}
                onShipRequest={handleShipRequest}
                refreshKey={refreshRequestsKey}
              />
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
