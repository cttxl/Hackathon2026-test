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

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      containerRef.current.style.setProperty('--mouse-x', `${x}px`);
      containerRef.current.style.setProperty('--mouse-y', `${y}px`);
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/logist" element={<LogistPage />} />
          <Route path="/driver" element={<DriverPage />} />
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
