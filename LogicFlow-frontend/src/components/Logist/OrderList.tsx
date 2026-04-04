import { Order } from '../../data/mockOrders';

interface OrderListProps {
  orders: Order[];
  onEditClick: (order: Order) => void;
  onProductsClick: (order: Order) => void;
}

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'Pending':    return { border: 'status-pending',    badge: 'badge-pending' };
    case 'Accepted':   return { border: 'status-accepted',   badge: 'badge-accepted' };
    case 'In Transit': return { border: 'status-intransit',  badge: 'badge-intransit' };
    case 'Delivered':  return { border: 'status-delivered',  badge: 'badge-delivered' };
    case 'Canceled':   return { border: 'status-canceled',   badge: 'badge-canceled' };
    default:           return { border: 'status-pending',    badge: 'badge-pending' };
  }
};

export function OrderList({ orders, onEditClick, onProductsClick }: OrderListProps) {
  const sortedOrders = [...orders].sort((a, b) => a.priority - b.priority);

  if (orders.length === 0) {
    return (
      <div className="order-list-container">
        <div style={{ color: '#fff', opacity: 0.5, textAlign: 'center', paddingTop: '40px' }}>
          No active orders.
        </div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      {sortedOrders.map(order => {
        const classes = getStatusClasses(order.status);
        return (
          <div key={order.id} className={`order-card ${classes.border}`}>
            <div className="order-info">
              <span className="order-title">
                {order.transportName} <span style={{ opacity: 0.5 }}>| #{order.id}</span>
              </span>
              <span className="order-sub">Driver: {order.driverName}</span>
              <span className="order-sub">
                Departs: {order.placeOfDeparture} &nbsp;·&nbsp; Arrival: {order.timeOfArrival}
              </span>
              <div>
                <span className={`status-badge ${classes.badge}`}>{order.status}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <button
                className="btn-edit"
                onClick={() => onProductsClick(order)}
                style={{ background: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.4)', color: '#38bdf8' }}
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
