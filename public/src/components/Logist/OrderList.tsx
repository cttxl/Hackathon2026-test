import type { Order } from '../../types/api';

interface OrderListProps {
  orders: Order[];
  onEditClick: (order: Order) => void;
  onProductsClick: (order: Order) => void;
}

const STATUS_CLASSES: Record<string, { border: string; badge: string }> = {
  Pending: { border: 'status-pending', badge: 'badge-pending' },
  Accepted: { border: 'status-accepted', badge: 'badge-accepted' },
  'In Transit': { border: 'status-intransit', badge: 'badge-intransit' },
  Delivered: { border: 'status-delivered', badge: 'badge-delivered' },
  Canceled: { border: 'status-canceled', badge: 'badge-canceled' },
};

const getStatusClasses = (status: string) =>
  STATUS_CLASSES[status] ?? { border: 'status-pending', badge: 'badge-pending' };

export function OrderList({ orders, onEditClick, onProductsClick }: OrderListProps) {
  if (!orders) return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading or Access Denied...</div>;

  const safeOrders = orders || [];
  const sortedOrders = [...safeOrders].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  if ((sortedOrders?.length || 0) === 0) {
    return (
      <div className="order-list-container">
        <div style={{ color: '#94a3b8', opacity: 0.7, textAlign: 'center', paddingTop: '40px' }}>
          No arrivals found.
        </div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      {sortedOrders?.map(order => {
        const classes = getStatusClasses(order.status);
        return (
          <div key={order.id} className={`order-card ${classes.border}`}>
            <div className="order-info">

              <span className="order-title">
                {order.transportName}
                <span style={{ opacity: 0.5, fontWeight: 400 }}> | #{order.id.slice(0, 8)}</span>
              </span>

              <span className="order-sub">
                Driver: <strong style={{ color: '#e2e8f0' }}>{order.driverName}</strong>
              </span>

              <span className="order-sub">
                ETA: <strong style={{ color: '#f1f5f9' }}>{order.timeOfArrival}</strong>
              </span>

              <div>
                <span className={`status-badge ${classes.badge}`}>{order.status}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <button
                className="btn-edit"
                style={{
                  background: 'rgba(56,189,248,0.15)',
                  borderColor: 'rgba(56,189,248,0.4)',
                  color: '#38bdf8',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => onProductsClick(order)}
              >
                Products
              </button>
              <button
                className="btn-edit"
                onClick={() => onEditClick(order)}
              >
                Edit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

