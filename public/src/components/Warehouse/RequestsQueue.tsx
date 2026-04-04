import React, { useEffect, useState, useCallback } from 'react';
import { ApiRequest, ApiProduct, RequestStatus } from '../../types/api';
import { getRequests, getProductById } from '../../services/api';

interface RequestsQueueProps {
  selectedWarehouseId: string;
  onShipRequest: (id: string) => void;
}

type FilterStatus = 'all' | RequestStatus;

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)' },
  accepted: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)' },
  shipped: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)' },
  delivered: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)' },
  cancelled: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const RequestsQueue: React.FC<RequestsQueueProps> = ({
  selectedWarehouseId,
  onShipRequest,
}) => {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [products, setProducts] = useState<Record<string, ApiProduct>>({});
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch requests whenever the warehouse changes ──────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getRequests({ delivery_point_id: selectedWarehouseId });
      const data = res?.data ?? [];
      setRequests(data);

      // Resolve unique product names
      const uniqueProductIds = Array.from(new Set(data.map((r) => r.product_id)));
      const missing = uniqueProductIds.filter((id) => !products[id]);
      if (missing.length > 0) {
        const results = await Promise.allSettled(missing.map((id) => getProductById(id)));
        setProducts((prev) => {
          const next = { ...prev };
          results.forEach((r) => {
            if (r.status === 'fulfilled') next[r.value.id] = r.value;
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Could not load requests. Check API connectivity.');
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  const statusCounts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="operations-panel">
      {/* Header */}
      <div className="panel-header" style={{ marginBottom: '14px' }}>
        <h3 className="panel-title" style={{ fontSize: '18px' }}>Requests Queue</h3>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
          {filtered.length} of {requests.length}
        </span>
      </div>

      {/* Status filter */}
      <div style={{ marginBottom: '12px', flexShrink: 0 }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.03)',
          padding: '3px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {(['all', 'pending', 'accepted', 'shipped', 'delivered', 'cancelled'] as FilterStatus[]).map((s) => {
            const isActive = filterStatus === s;
            const col = s === 'all' ? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' } : STATUS_COLORS[s];
            const count = s === 'all' ? requests.length : (statusCounts[s] ?? 0);
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  flex: 1,
                  minWidth: '65px',
                  padding: '5px 8px',
                  border: isActive ? `1px solid ${col.border}` : '1px solid transparent',
                  borderRadius: '9px',
                  background: isActive ? col.bg : 'transparent',
                  color: isActive ? col.color : 'rgba(255,255,255,0.35)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
                <span style={{
                  fontSize: '9px',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? col.color : 'inherit',
                  borderRadius: '6px',
                  padding: '1px 5px',
                  opacity: count === 0 && !isActive ? 0.3 : 1,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable card list */}
      <div className="scrollable-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading requests…
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center', padding: '30px', color: '#fca5a5',
            background: 'rgba(239,68,68,0.07)', borderRadius: '10px',
          }}>
            ⚠ {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
            {requests.length === 0
              ? 'No requests for this warehouse.'
              : `No ${filterStatus} requests.`}
          </div>
        ) : (
          filtered.map((req) => {
            const product = products[req.product_id];
            const sc = STATUS_COLORS[req.status] ?? STATUS_COLORS['pending'];
            const canShip = req.status === 'pending' || req.status === 'accepted';

            return (
              <div key={req.id} className="operation-card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: '20px' }}>
                {/* Left side: Info and Badges */}
                <div className="op-info" style={{ flex: 1, alignItems: 'flex-start' }}>
                  <span className="op-main">
                    {product?.name ?? `Product ${req.product_id.slice(-8)}`}
                  </span>
                  <span className="op-sub">
                    ID: {req.product_id.slice(-12).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: '2px' }}>
                    Qty <strong style={{ color: '#fff', marginLeft: '4px' }}>{req.quantity}</strong>
                  </span>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: sc.color,
                      background: sc.bg.replace('0.12', '0.08'),
                      border: `1px solid ${sc.border}`,
                      borderRadius: '20px',
                      padding: '4px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: sc.color,
                        boxShadow: `0 0 8px ${sc.color}80`,
                      }} />
                      {STATUS_LABELS[req.status] ?? req.status}
                    </span>

                    {req.emergency && (
                      <span className="critical-tag" style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: '1px solid transparent',
                      }}>
                        Critical
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Action Button */}
                {canShip && (
                  <button
                    className="btn-action-teal"
                    onClick={() => onShipRequest(req.id)}
                    style={{ marginLeft: '16px' }}
                  >
                    Ship Now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14m-7-7 7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
