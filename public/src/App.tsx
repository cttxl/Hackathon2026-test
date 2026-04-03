import { useState, useEffect } from "react";

const API_URL = "http://localhost:8080";

type UserInfo = {
  id: string;
  type: string;
  role: string;
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("1111");

  const [activeTab, setActiveTab] = useState("employees");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form states for creation
  const [formData, setFormData] = useState<any>({});

  const tabs = [
    "employees", "clients", "delivery-points", "products", "sku", 
    "requests", "arrivals", "arrivals-schedule", "arrivals-requests", "vehicles"
  ];

  /* ---------------------------------
   * API CALLS
   * --------------------------------- */
  const login = async () => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok) {
        setToken(json.token);
        setUser(json.user);
      } else {
        alert("Login failed: " + JSON.stringify(json));
      }
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setData(null);
  };

  const fetchList = async (resource: string) => {
    setLoading(true);
    try {
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/${resource}`, { headers });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData({ error: String(err) });
    }
    setLoading(false);
  };

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const formattedData = { ...formData };
      for (const k in formattedData) {
        if (!isNaN(formattedData[k]) && formattedData[k] !== "") {
          formattedData[k] = Number(formattedData[k]);
        }
      }

      const res = await fetch(`${API_URL}/${activeTab}`, {
        method: "POST",
        headers,
        body: JSON.stringify(formattedData)
      });
      const json = await res.json();
      if (res.ok) {
        alert("Created successfully!");
        setFormData({});
        fetchList(activeTab);
      } else {
        alert("Creation failed: " + JSON.stringify(json));
      }
    } catch (err) {
      alert("Error: " + err);
    }
  };

  useEffect(() => {
    fetchList(activeTab);
    setFormData({});
  }, [activeTab, token]);

  /* ---------------------------------
   * DYNAMIC FORM BUILDER
   * --------------------------------- */
  const getFormFields = () => {
    switch (activeTab) {
      case "employees": return ["fullname", "email", "password", "phone", "role"];
      case "clients": return ["name", "email", "password", "phone"];
      case "products": return ["name", "weight", "height", "width", "length"];
      case "delivery-points": return ["name", "address", "owner_id", "type", "height", "width", "length"];
      case "sku": return ["product_id", "delivery_point_id"];
      case "requests": return ["product_id", "quantity", "delivery_point_id", "emergency"];
      case "vehicles": return ["name", "fuel_type", "fuel_consumption", "max_weight", "max_height", "max_width", "max_length", "address"];
      default: return [];
    }
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar glass">
        <div className="brand">
          ✨ NexusUI
        </div>

        <div className="auth-panel glass panel">
          {user ? (
            <>
              <div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <span className="badge">Authenticated</span>
                </div>
                <div className="user-snippet">
                  <div><strong>ID:</strong> {user.id.substring(0,8)}...</div>
                  <div><strong>Type:</strong> {user.type}</div>
                  {user.role && <div><strong>Role:</strong> {user.role}</div>}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={logout}>Sign Out</button>
            </>
          ) : (
            <>
              <h3>Admin Identity</h3>
              <input 
                className="input-field" 
                placeholder="Email" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
              />
              <input 
                className="input-field" 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
              />
              <button className="btn" onClick={login}>Authenticate</button>
            </>
          )}
        </div>

        <div className="nav-menu">
          <h3 style={{ marginLeft: "1rem", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)"}}>
            Endpoints
          </h3>
          {tabs.map((t) => (
            <button 
              key={t}
              className={`nav-item ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              /{t}
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="status-bar glass">
          <h2>Endpoint Preview: <span style={{ color: "var(--accent-color)" }}>/{activeTab}</span></h2>
          <button className="btn btn-secondary" onClick={() => fetchList(activeTab)}>
            {loading ? "Refreshing..." : "↻ Refresh Data"}
          </button>
        </header>

        <div className="grid-content">
          <div className="panel glass" style={{ gridColumn: getFormFields().length > 0 ? "1" : "1 / 3" }}>
            <h3>Response Inspector</h3>
            <pre className="json-viewer">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          {getFormFields().length > 0 && (
            <div className="panel glass">
              <h3>Create Record</h3>
              <form onSubmit={createItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <div className="form-grid">
                  {getFormFields().map((field) => (
                    <input
                      key={field}
                      className="input-field"
                      placeholder={field}
                      value={formData[field] || ""}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      required={field !== "emergency"} // simple workaround
                    />
                  ))}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <button type="submit" className="btn" style={{ width: '100%' }}>Make POST request</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
