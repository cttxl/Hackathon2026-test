import { useRef, MouseEvent, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginMenu } from './components/LoginMenu';
import { AdminPage } from './pages/AdminPage';
import { LogistPage } from './pages/LogistPage';
import { DriverPage } from './pages/DriverPage';
import { WarehousePage } from './pages/WarehousePage';
import { TestApiPage } from './pages/TestApiPage';
import './index.css';

function ProtectedRoute({ roles, children }: { roles: string[]; children: ReactNode }) {
  const raw = localStorage.getItem('currentUser');
  const user = raw
    ? (() => { try { return JSON.parse(raw); } catch { return null; } })()
    : null;
  const role: string = user?.role ?? '';

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

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
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logist"
            element={
              <ProtectedRoute roles={['logistician', 'admin']}>
                <LogistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver"
            element={
              <ProtectedRoute roles={['driver', 'admin']}>
                <DriverPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute roles={['warehouse_manager', 'admin']}>
                <WarehousePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/testapi"
            element={
              <ProtectedRoute roles={['admin']}>
                <TestApiPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
