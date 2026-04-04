import React, { useState } from 'react';
import { ApiRequest, Order } from '../../types/api';

interface OperationsQueueProps {
  orders: Order[];
  requests: ApiRequest[];
  onAcceptArrival: (id: string) => void;
  onShipRequest: (id: string) => void;
  loading: boolean;
}

export const OperationsQueue: React.FC<OperationsQueueProps> = ({
  orders,
  requests,
  onAcceptArrival,
  onShipRequest,
  loading
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  if (!orders) return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading or Access Denied...</div>;

  const safeOrders = orders || [];
  const safeRequests = requests || [];

  const incomingArrivals = safeOrders?.filter((o) => o.status !== 'Delivered' && o.status !== 'Canceled');
  const outgoingRequests = safeRequests?.filter((r) => r.status === 'pending' || r.status === 'accepted');

  return (
    <div className="operations-panel">
      <div className="panel-header">
        <h3 className="panel-title">Operations Queue</h3>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming ({(incomingArrivals?.length || 0)})
        </button>
        <button
          className={`tab-btn ${activeTab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('outgoing')}
        >
          Picking/Ship ({(outgoingRequests?.length || 0)})
        </button>
      </div>

      <div className="scrollable-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Loading operations...</div>
        ) : activeTab === 'incoming' ? (
          <div>
            {(incomingArrivals?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No incoming arrivals.</div>
            ) : (
              incomingArrivals?.map((order) => (
                <div key={order.id} className="operation-card">
                  <div className="op-info">
                    <span className="op-main">Ref #{order.id.slice(-6)} | {order.transportName}</span>
                    <span className="op-sub">Driver: {order.driverName}</span>
                    <span className={`status-badge badge-${order.status.toLowerCase().replace(' ', '')}`}>
                      {order.status}
                    </span>
                  </div>
                  <button
                    className="btn-action-teal"
                    onClick={() => onAcceptArrival(order.id)}
                  >
                    Receive/Accept
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {(outgoingRequests?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No requests to ship.</div>
            ) : (
              outgoingRequests?.map((request) => (
                <div key={request.id} className="operation-card">
                  <div className="op-info">
                    <span className="op-main">Request #{request.id.slice(-6)}</span>
                    <span className="op-sub">Quantity: {request.quantity} SKU: {request.sku_id.slice(-8)}</span>
                    <span className={`status-badge badge-${request.status}`}>
                      {request.status}
                    </span>
                  </div>
                  <button
                    className="btn-action-teal"
                    onClick={() => onShipRequest(request.id)}
                  >
                    Ship Now
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
