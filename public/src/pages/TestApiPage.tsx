import { useState, useEffect, useCallback } from 'react';
import './TestApiPage.css';

const TABS = [
  { id: 'employees', label: 'Employees', icon: '👤' },
  { id: 'clients', label: 'Clients', icon: '🏢' },
  { id: 'delivery-points', label: 'Points', icon: '📍' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'sku', label: 'SKU (Stock)', icon: '🏷️' },
  { id: 'requests', label: 'Requests', icon: '📝' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚛' },
  { id: 'arrivals', label: 'Arrivals (Orders)', icon: '📅' },
  { id: 'arrivals-requests', label: 'Order Items', icon: '🔗' },
];

export function TestApiPage() {
  const [activeTab, setActiveTab] = useState('employees');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [dbData, setDbData] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const fetchData = useCallback(async () => {
    if (!token) return;
    setStatus(s => ({ ...s, loading: true, error: '', success: '' }));
    try {
      const res = await fetch(`${apiBase}/${activeTab}?limit=100`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || `Error ${res.status}: ${res.statusText}`);
      }
      
      setDbData(json);
    } catch (err) {
      console.error('Fetch error:', err);
      setStatus(s => ({ ...s, error: err instanceof Error ? err.message : 'Failed to fetch data' }));
      setDbData(null);
    } finally {
      setStatus(s => ({ ...s, loading: false }));
    }
  }, [activeTab, token, apiBase]);

  useEffect(() => {
    if (token) fetchData();
  }, [fetchData, token]);

  const handleQuickLogin = async () => {
    setStatus(s => ({ ...s, loading: true, error: '', success: '' }));
    try {
      const res = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@admin.com', password: '1111' })
      });
      const json = await res.json();
      if (res.ok && json.token) {
        setToken(json.token);
        localStorage.setItem('token', json.token);
        localStorage.setItem('currentUser', JSON.stringify(json.user));
        setStatus(s => ({ ...s, success: 'Logged in as Admin!' }));
      } else {
        throw new Error(json.error || 'Login failed');
      }
    } catch (err) {
      setStatus(s => ({ ...s, error: err instanceof Error ? err.message : 'Login failed' }));
    } finally {
      setStatus(s => ({ ...s, loading: false }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(s => ({ ...s, loading: true, error: '', success: '' }));
    try {
      const res = await fetch(`${apiBase}/${activeTab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      
      if (res.ok) {
        setStatus(s => ({ ...s, success: 'Record created successfully!' }));
        setFormData({});
        fetchData();
      } else {
        throw new Error(json.error || json.message || `Creation failed (${res.status})`);
      }
    } catch (err) {
      setStatus(s => ({ ...s, error: err instanceof Error ? err.message : 'Network error' }));
    } finally {
      setStatus(s => ({ ...s, loading: false }));
    }
  };

  const getFieldsForTab = (tab: string) => {
    switch (tab) {
      case 'employees':
        return [
          { name: 'fullname', placeholder: 'John Doe' },
          { name: 'email', placeholder: 'john@example.com' },
          { name: 'password', placeholder: 'password123' },
          { name: 'phone', placeholder: '+380991234567 (must start with +)' },
          { name: 'role', placeholder: 'admin, logistician, driver, or warehouse_manager' },
        ];
      case 'clients':
        return [
          { name: 'name', placeholder: 'Acme Corp' },
          { name: 'email', placeholder: 'contact@acme.com' },
          { name: 'password', placeholder: 'password123' },
          { name: 'phone', placeholder: '+380...' },
        ];
      case 'delivery-points':
        return [
          { name: 'name', placeholder: 'Lviv Warehouse A' },
          { name: 'address', placeholder: 'vul. Naukova, 7' },
          { name: 'owner_id', placeholder: 'UUID of client or admin' },
          { name: 'type', placeholder: 'warehouse, provider, or client_point' },
          { name: 'height', placeholder: '600 (Optional)' },
          { name: 'width', placeholder: '2000 (Optional)' },
          { name: 'length', placeholder: '5000 (Optional)' },
        ];
      case 'products':
        return [
          { name: 'name', placeholder: 'Product Name' },
          { name: 'weight', placeholder: '3000' },
          { name: 'height', placeholder: '30' },
          { name: 'width', placeholder: '20' },
          { name: 'length', placeholder: '10' },
        ];
      case 'sku':
        return [
          { name: 'product_id', placeholder: 'UUID' },
          { name: 'delivery_point_id', placeholder: 'UUID' },
        ];
      case 'requests':
        return [
          { name: 'product_id', placeholder: 'UUID' },
          { name: 'delivery_point_id', placeholder: 'UUID' },
          { name: 'quantity', placeholder: '5' },
          { name: 'emergency', placeholder: 'critical, high, or default' },
        ];
      case 'vehicles':
        return [
          { name: 'name', placeholder: 'Volvo FH16' },
          { name: 'fuel_type', placeholder: 'diesel, gasoline, or electric' },
          { name: 'fuel_consumption', placeholder: '32' },
          { name: 'max_weight', placeholder: '22000' },
          { name: 'max_height', placeholder: '400' },
          { name: 'max_width', placeholder: '250' },
          { name: 'max_length', placeholder: '1360' },
          { name: 'address', placeholder: 'Current location address' },
        ];
      case 'arrivals':
        return [
          { name: 'transport_id', placeholder: 'UUID' },
          { name: 'driver_id', placeholder: 'UUID' },
          { name: 'time_to_arrival', placeholder: '2026-04-10T14:00:00Z' },
        ];
      case 'arrivals-requests':
        return [
          { name: 'arrival_id', placeholder: 'UUID' },
          { name: 'request_id', placeholder: 'UUID' },
        ];
      default:
        return [];
    }
  };

  const fields = getFieldsForTab(activeTab);

  return (
    <div className="api-dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', margin: 0, background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          API Debugger Dashboard
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <span className={`api-status-badge ${status.success ? 'success' : status.error ? 'error' : ''}`} style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {status.loading ? '⏳ Processing...' : status.success ? '✅ ' + status.success : status.error ? '❌ ' + status.error : 'Ready'}
             </span>
             <button className="api-menu-btn" onClick={() => { localStorage.removeItem('token'); setToken(''); setDbData(null); }} style={{ color: '#ef4444' }}>Logout</button>
        </div>
      </div>

      <div className="api-layout">
        {/* Sidebar */}
        <div className="api-menu-panel">
          <div className="sidebar-identity">
             <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 700 }}>SESSION CONTROL</div>
             <button 
               className="api-menu-btn active" 
               onClick={handleQuickLogin}
               style={{ width: '100%', marginBottom: '12px', textAlign: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }}
             >
               ⚡ Login as Admin
             </button>
             
             <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>JWT TOKEN</div>
             <input 
               type="text" 
               className="api-token-input" 
               value={token} 
               onChange={(e) => { setToken(e.target.value); localStorage.setItem('token', e.target.value); }}
               placeholder="No token active..."
               style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#38bdf8', fontSize: '10px', fontFamily: 'monospace' }}
             />
          </div>

          <h3>Endpoints</h3>
          <div className="api-menu-list">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`api-menu-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setFormData({}); setStatus({ loading: false, error: '', success: '' }); }}
              >
                <span style={{ marginRight: '8px' }}>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="api-content-layout">
          {/* Creation Panel */}
          <div className="api-content-panel">
            <h3 className="title-light">Create New <span>{activeTab.replace('-', ' ')}</span></h3>
            <form onSubmit={handleCreate}>
              <div className="api-form-grid">
                {fields.map(field => (
                  <div key={field.name} className="api-input-group">
                    <label>{field.name.replace('_', ' ')}</label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      required={!['height', 'width', 'length'].includes(field.name)}
                    />
                  </div>
                ))}
              </div>
              <div className="api-form-actions">
                <button type="submit" className="api-menu-btn active" style={{ padding: '12px 40px', fontWeight: 700 }} disabled={status.loading || !token}>
                  {status.loading ? 'Creating...' : '+ Create Record'}
                </button>
              </div>
            </form>
          </div>

          {/* Data Explorer */}
          <div className="api-content-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ margin: 0 }}>Database Explorer</h3>
               <button className="api-menu-btn" onClick={fetchData} disabled={!token} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)' }}>🔄 Refresh Data</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px' }}>
               <div style={{ overflowX: 'auto' }}>
                  <pre className="api-json-viewer">
                    {dbData ? JSON.stringify(dbData, null, 2) : !token ? 'Please login to view data.' : 'No data loaded.'}
                  </pre>
               </div>
               
               <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Quick Details</h4>
                  {dbData?.data && Array.isArray(dbData.data) && (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       {dbData.data.slice(0, 8).map((item: any) => (
                         <li key={item.id} style={{ fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                            <div style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || item.fullname || item.id.slice(0, 8)}</div>
                            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>{item.email || item.address || item.role || item.status || 'Active Record'}</div>
                         </li>
                       ))}
                       {dbData.data.length > 8 && (
                         <div style={{ textAlign: 'center', fontSize: '12px', color: '#38bdf8', marginTop: '10px', fontWeight: 600 }}>
                            + {dbData.data.length - 8} more items...
                         </div>
                       )}
                       {dbData.data.length === 0 && (
                         <div style={{ textAlign: 'center', color: '#475569', fontSize: '13px', padding: '20px 0' }}>Table is empty</div>
                       )}
                    </ul>
                  )}
                  {!dbData?.data && token && (
                    <div style={{ textAlign: 'center', color: '#475569', fontSize: '13px', padding: '20px 0' }}>Load data to see summary</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
