import type { ApiRequest, ApiProduct, ApiDeliveryPoint } from '../../types/api';

interface RequestListProps {
  requests: ApiRequest[];
  products: ApiProduct[];
  deliveryPoints: ApiDeliveryPoint[];
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'badge-pending',
  accepted: 'badge-accepted',
  shipped: 'badge-intransit',
  delivered: 'badge-delivered',
  cancelled: 'badge-canceled',
};

export function RequestList({ requests, products, deliveryPoints }: RequestListProps) {
  const prodMap = new Map(products.map(p => [p.id, p.name]));
  const dpMap = new Map(deliveryPoints.map(dp => [dp.id, dp.name]));

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
      {requests.map(req => {
        const statusKey = req.status?.toLowerCase() || 'pending';
        const badgeClass = STATUS_CLASSES[statusKey] ?? 'badge-pending';
        const pid = req.product_id || req.sku_id;
        const productName = (pid && prodMap.get(pid)) ?? (pid ? `ITEM:${pid.slice(0, 8)}` : 'Unknown Product');
        const dpName = (req.delivery_point_id && dpMap.get(req.delivery_point_id)) ?? 'Unknown Destination';

        return (
          <div key={req.id || Math.random().toString()} className="order-card" style={{ borderLeftColor: 'rgba(255,255,255,0.2)' }}>
            <div className="order-info">
              <span className="order-title">
                {productName}
                <span style={{ opacity: 0.5, fontWeight: 400 }}> | {req.quantity} units</span>
              </span>

              <span className="order-sub">
                To: <strong style={{ color: '#e2e8f0' }}>{dpName}</strong>
              </span>

              <span className="order-sub" style={{ fontSize: '11px', opacity: 0.6 }}>
                ID: #{req.id?.slice(0, 8) ?? 'N/A'}
              </span>

              <div>
                <span className={`status-badge ${badgeClass}`}>{req.status}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
