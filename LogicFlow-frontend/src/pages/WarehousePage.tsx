import { useState, useEffect, useCallback } from 'react';
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
  patchRequest 
} from '../services/api';
import { ApiDeliveryPoint, ApiSku, ApiArrival, ApiRequest } from '../types/api';
import './WarehousePage.css';
import './AdminPage.css'; // Global dashboard styles

export function WarehousePage() {
  const [warehouses, setWarehouses] = useState<ApiDeliveryPoint[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  
  const [skus, setSkus] = useState<ApiSku[]>([]);
  const [arrivals, setArrivals] = useState<ApiArrival[]>([]);
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingOps, setLoadingOps] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Load All Warehouses ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await getDeliveryPoints('warehouse');
        setWarehouses(res.data);
        if (res.data.length > 0) {
          setSelectedWarehouseId(res.data[0].id);
        }
      } catch (err) {
        setApiError('Failed to fetch warehouses. API might be offline.');
      }
    };
    fetchWarehouses();
  }, []);

  // ── Load Data for Selected Warehouse ──────────────────────────────────────
  const loadWarehouseData = useCallback(async () => {
    if (!selectedWarehouseId) return;
    
    setLoadingOps(true);
    try {
      const [skuRes, arrivalRes, requestRes] = await Promise.all([
        getSkus(selectedWarehouseId),
        getArrivals(), // Showing all arrivals for now
        getRequests({ delivery_point_id: selectedWarehouseId })
      ]);
      
      setSkus(skuRes.data);
      setArrivals(arrivalRes.data);
      setRequests(requestRes.data);
    } catch (err) {
      setApiError('Failed to sync warehouse data.');
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

  return (
    <div className="warehouse-dashboard-container">
      <Header title="Warehouse Dashboard" />
      
      <div className="warehouse-header-row">
        <WarehouseSelector 
          warehouses={warehouses}
          selectedId={selectedWarehouseId}
          onSelect={setSelectedWarehouseId}
          loading={loading && warehouses.length === 0}
        />
        
        {apiError && (
          <div style={{ color: '#fde047', fontSize: '13px', background: 'rgba(234,179,8,0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.3)' }}>
            ⚠ {apiError}
          </div>
        )}
      </div>

      <div className="warehouse-split-layout">
        <InventoryList 
          skus={skus} 
          loading={loading} 
        />
        
        <OperationsQueue 
          arrivals={arrivals}
          requests={requests}
          onAcceptArrival={handleAcceptArrival}
          onShipRequest={handleShipRequest}
          loading={loadingOps}
        />
      </div>
    </div>
  );
}
