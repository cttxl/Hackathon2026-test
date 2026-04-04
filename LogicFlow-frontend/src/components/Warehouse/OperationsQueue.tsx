import React, { useState } from 'react';
import { ApiArrival, ApiRequest } from '../../types/api';

interface OperationsQueueProps {
  arrivals: ApiArrival[];
  requests: ApiRequest[];
  onAcceptArrival: (id: string) => void;
  onShipRequest: (id: string) => void;
  loading: boolean;
}

export const OperationsQueue: React.FC<OperationsQueueProps> = ({
  arrivals,
  requests,
  onAcceptArrival,
  onShipRequest,
  loading
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const incomingArrivals = arrivals.filter((a) => a.status !== 'delivered' && a.status !== 'cancelled');
  const outgoingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'accepted');

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
          Incoming ({incomingArrivals.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('outgoing')}
        >
          Picking/Ship ({outgoingRequests.length})
        </button>
      </div>

      <div className="scrollable-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Loading operations...</div>
        ) : activeTab === 'incoming' ? (
          <div>
            {incomingArrivals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No incoming arrivals.</div>
            ) : (
              incomingArrivals.map((arrival) => (
                <div key={arrival.id} className="operation-card">
                  <div className="op-info">
                    <span className="op-main">Arrival #{arrival.id.slice(-6)}</span>
                    <span className="op-sub">Driver ID: {arrival.driver_id.slice(-8)}</span>
                    <span className={`status-badge badge-${arrival.status.toLowerCase().replace(' ', '')}`}>
                      {arrival.status}
                    </span>
                  </div>
                  <button 
                    className="btn-action-teal"
                    onClick={() => onAcceptArrival(arrival.id)}
                  >
                    Receive/Accept
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {outgoingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No requests to ship.</div>
            ) : (
              outgoingRequests.map((request) => (
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
