import { useState, useEffect } from 'react';
import './index.css';

const API_BASE = 'http://localhost:8080';

const endpoints = [
  { id: 'login', name: 'Authentication (/login)', path: '/login', method: 'POST' },
  { id: 'employees', name: 'Employees', path: '/employees', method: 'GET' },
  { id: 'clients', name: 'Clients', path: '/clients', method: 'GET' },
  { id: 'points', name: 'Delivery Points', path: '/delivery-points', method: 'GET' },
  { id: 'products', name: 'Products', path: '/products', method: 'GET' },
  { id: 'sku', name: 'SKU Inventory', path: '/sku', method: 'GET' },
  { id: 'requests', name: 'Orders/Requests', path: '/requests', method: 'GET' },
  { id: 'arrivals', name: 'Arrivals', path: '/arrivals', method: 'GET' },
  { id: 'schedule', name: 'Arrivals Schedule', path: '/arrivals-schedule', method: 'GET' },
  { id: 'arr_req', name: 'Arrival Requests', path: '/arrivals-requests', method: 'GET' },
  { id: 'vehicles', name: 'Vehicles', path: '/vehicles', method: 'GET' },
];

const DynamicCard = ({ item }: { item: any }) => {
  return (
    <div className="glass-card fade-in">
      {Object.entries(item).map(([key, value]) => {
        let displayValue = String(value);
        if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value);
        }

        // Apply badge styling for specific status fields if any
        if (key === 'status') {
          return (
            <div className="data-row" key={key}>
              <span className="data-label">{key.replace('_', ' ')}</span>
              <span className="data-value">
                <span className={`status-badge ${value === 'pending' ? 'pending' : 'success'}`}>
                  {String(value)}
                </span>
              </span>
            </div>
          );
        }

        return (
          <div className="data-row" key={key}>
            <span className="data-label">{key.replace(/_/g, ' ')}</span>
            <span className="data-value">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState(endpoints[1]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(`${API_BASE}${activeTab.path}`, {
          method: activeTab.method,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        
        // Handle standard wrapper { data: [...] } vs raw struct
        if (json.data && Array.isArray(json.data)) {
          setData(json.data);
        } else {
          // Put single object into array to reuse grid renderer
          setData([json]); 
        }
      } catch (err: any) {
        setError(err.message || 'Error connecting to backend API');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          Logistics API
        </div>
        {endpoints.map((ep) => (
          <div
            key={ep.id}
            className={`nav-item ${activeTab.id === ep.id ? 'active' : ''}`}
            onClick={() => setActiveTab(ep)}
          >
            {ep.name}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="header fade-in">
          <h1>{activeTab.name}</h1>
          <p>Mock Data Explorer — <code>{activeTab.method} {activeTab.path}</code></p>
        </div>

        {loading && (
          <div className="loader-container">
            <div className="loader" />
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--warning-color)', padding: '20px', border: '1px solid var(--warning-color)', borderRadius: '12px', background: 'rgba(245,158,11,0.1)' }}>
            <strong>Connection Error:</strong> {error}. Ensure `make up` is running.
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid-container">
            {data.map((item: any, i: number) => (
              <DynamicCard key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
