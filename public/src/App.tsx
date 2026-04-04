import { useRef, MouseEvent } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LoginMenu } from './components/LoginMenu';
import { AdminPage } from './pages/AdminPage';
import { LogistPage } from './pages/LogistPage';
import { DriverPage } from './pages/DriverPage';
import { WarehousePage } from './pages/WarehousePage';
import './index.css';

function AppInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

<<<<<<< Updated upstream
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
      
      const numberFields = ["weight", "height", "width", "length", "quantity", "fuel_consumption", "max_weight", "max_height", "max_width", "max_length", "priority"];
      
      for (const k in formattedData) {
        if (numberFields.includes(k) && formattedData[k] !== "") {
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
=======
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      containerRef.current.style.setProperty('--mouse-x', `${x}px`);
      containerRef.current.style.setProperty('--mouse-y', `${y}px`);
>>>>>>> Stashed changes
    }
  };

  return (
    <div
      className="app-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Brand bar only shown on the login page */}
      {isLoginPage && (
        <header className="brand-header">
          <h1 className="brand-title">LogicFlow</h1>
        </header>
      )}

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <div className="login-route-wrapper">
                <LoginMenu />
              </div>
            }
          />
          <Route path="/admin"     element={<AdminPage />} />
          <Route path="/logist"    element={<LogistPage />} />
          <Route path="/driver"    element={<DriverPage />} />
          <Route path="/warehouse" element={<WarehousePage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
