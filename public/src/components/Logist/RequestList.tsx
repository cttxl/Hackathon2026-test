import type { ApiRequest, ApiProduct, ApiDeliveryPoint, ApiArrival, ApiArrivalRequest } from '../../types/api';

interface RequestListProps {
  requests: ApiRequest[];
  products: ApiProduct[];
  deliveryPoints: ApiDeliveryPoint[];
  arrivalRequests: ApiArrivalRequest[];
  arrivals: ApiArrival[];
  vehicleMap: Map<string, string>;
  driverMap: Map<string, string>;
  onUnlink?: (requestId: string) => void;
  onRebase?: (requestId: string) => void;
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'badge-pending',
  accepted: 'badge-accepted',
  shipped: 'badge-intransit',
  delivered: 'badge-delivered',
  cancelled: 'badge-canceled',
};

export function RequestList({
  requests,
  products,
  deliveryPoints,
  arrivalRequests,
  arrivals,
  vehicleMap,
  driverMap,
  onUnlink,
  onRebase
}: RequestListProps) {
  const prodMap = new Map(products.map(p => [p.id, p.name]));
  const dpMap = new Map(deliveryPoints.map(dp => [dp.id, dp.name]));

  // 0. Sort requests by emergency rank
  const emergencyOrder: Record<string, number> = { critical: 0, high: 1, default: 2 };
  const sortedRequests = [...(requests || [])].sort((a, b) => {
    const rankA = emergencyOrder[a.emergency] ?? 2;
    const rankB = emergencyOrder[b.emergency] ?? 2;
    return rankA - rankB;
  });

  // 1. Map request_id -> arrival_id using actual mapping table
  const requestToArrival = new Map<string, string>();
  (arrivalRequests || []).forEach(ar => {
    requestToArrival.set(ar.request_id, ar.arrival_id);
  });

  // 2. Group requests by arrival_id
  const groups: Record<string, ApiRequest[]> = {};
  sortedRequests.forEach(req => {
    const aid = requestToArrival.get(req.id) ?? 'unassigned';
    if (!groups[aid]) groups[aid] = [];
    groups[aid].push(req);
  });

  const sortedArrivalIds = Object.keys(groups).sort((a, b) => {
    if (a === 'unassigned') return -1;
    if (b === 'unassigned') return 1;
    return 0; // Keep current order for actual arrivals
  });

  if (!requests?.length) {
    return (
      <div className="order-list-container">
        <div style={{ color: '#94a3b8', opacity: 0.7, textAlign: 'center', paddingTop: '40px' }}>
          No SKU requests found.
        </div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      {sortedArrivalIds.map(aid => {
        const groupRequests = groups[aid];
        const arrival = arrivals.find(a => a.id === aid);

        return (
          <div key={aid} className="request-group">
            <div className="group-header">
              {arrival ? (
                <>
                  <span className="group-title">
                    Arrival: <strong style={{ color: '#60a5fa' }}>{vehicleMap.get(arrival.transport_id) || 'Unknown Vehicle'}</strong>
                  </span>
                  <span className="group-subtitle">
                    Driver: {driverMap.get(arrival.driver_id) || 'Unknown Driver'} | {arrival.id.slice(0, 8)}
                  </span>
                </>
              ) : (
                <span className="group-title" style={{ opacity: 0.7 }}>Unassigned Requests</span>
              )}
            </div>

            <div className="group-content">
              {groupRequests.map(req => {
                const statusKey = req.status?.toLowerCase() || 'pending';
                const badgeClass = STATUS_CLASSES[statusKey] ?? 'badge-pending';
                const pid = req.product_id || req.sku_id;
                const productName = (pid && prodMap.get(pid)) ?? (pid ? `ITEM:${pid.slice(0, 8)}` : 'Unknown Product');
                const dpName = (req.delivery_point_id && dpMap.get(req.delivery_point_id)) ?? 'Unknown Destination';

                const emergencyClass = req.emergency === 'critical' ? 'order-card-critical' : (req.emergency === 'high' ? 'order-card-high' : '');
                const emergencyBadge = req.emergency === 'critical' ? (
                  <span className="emergency-badge badge-critical" style={{ marginLeft: 0 }}>CRITICAL</span>
                ) : (req.emergency === 'high' ? (
                  <span className="emergency-badge badge-high" style={{ marginLeft: 0 }}>HIGH</span>
                ) : null);

                return (
                  <div key={req.id || Math.random().toString()} className={`order-card ${emergencyClass}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="order-info" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className="order-title" style={{ display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.2' }}>
                        <span>{productName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {emergencyBadge}
                          <span style={{ opacity: 0.5, fontWeight: 400, whiteSpace: 'nowrap' }}>
                            {emergencyBadge ? '| ' : ''}{req.quantity} units
                          </span>
                        </div>
                      </div>

                      <span className="order-sub">
                        To: <strong style={{ color: '#e2e8f0' }}>{dpName}</strong>
                      </span>

                      <span className="order-sub" style={{ fontSize: '11px', opacity: 0.6 }}>
                        ID: #{req.id?.slice(0, 8) ?? 'N/A'}
                      </span>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                        <span className={`status-badge ${badgeClass}`}>{req.status}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {aid !== 'unassigned' && onUnlink && (
                            <button
                              className="btn-unlink"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnlink(req.id);
                              }}
                              title="Unlink from arrival"
                            >
                              Unlink
                            </button>
                          )}
                          {onRebase && (
                            <button
                              className="btn-rebase"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRebase(req.id);
                              }}
                              title={aid === 'unassigned' ? "Assign to arrival" : "Reassign to different arrival"}
                            >
                              {aid === 'unassigned' ? "Assign" : "Rebase"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
