import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Shared/Header';
import { EmployeeModal } from '../components/Admin/EmployeeModal';
import {
  getEmployees,
  createEmployee,
  patchEmployee,
  deleteEmployee,
  resetEmployeePassword,
} from '../services/api';
import type { ApiEmployee, ApiEmployeeRole } from '../types/api';
import type { Employee } from '../data/mockEmployees';
import { initialEmployees } from '../data/mockEmployees';
import './AdminPage.css';

// ── Adapters ─────────────────────────────────────────────────────────────────

const ROLE_API_TO_UI: Record<ApiEmployeeRole, Employee['role']> = {
  admin:             'Admin',
  logistician:       'Logist',
  driver:            'Driver',
  warehouse_manager: 'Warehouse Operator',
};

const ROLE_UI_TO_API: Record<Employee['role'], ApiEmployeeRole> = {
  Admin:               'admin',
  Logist:              'logistician',
  Driver:              'driver',
  'Warehouse Operator':'warehouse_manager',
};

function apiToUi(e: ApiEmployee): Employee {
  return {
    id:       e.id,
    fullName: e.fullname,
    email:    e.email,
    phone:    e.phone,
    role:     ROLE_API_TO_UI[e.role] ?? 'Driver',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminPage() {
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState<string | null>(null);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [selected,     setSelected]     = useState<Employee | null>(null);
  const [saving,       setSaving]       = useState(false);

  // ── Load employees ──────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await getEmployees(1, 100);
      setEmployees(res.data.map(apiToUi));
    } catch {
      // Fallback to mock data when backend is not available
      setEmployees(initialEmployees);
      setApiError('Using offline mock data — API not reachable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleHireClick = () => { setSelected(null); setIsModalOpen(true); };
  const handleEditClick = (emp: Employee) => { setSelected(emp); setIsModalOpen(true); };
  const handleClose = () => { setIsModalOpen(false); setSelected(null); };

  const handleSave = async (emp: Employee) => {
    setSaving(true);
    try {
      if (selected) {
        // Edit existing
        await patchEmployee(emp.id, {
          fullname: emp.fullName,
          email:    emp.email,
          phone:    emp.phone,
          role:     ROLE_UI_TO_API[emp.role],
        });
      } else {
        // Create new — password required; use placeholder so user can reset
        await createEmployee({
          fullname: emp.fullName,
          email:    emp.email,
          phone:    emp.phone,
          role:     ROLE_UI_TO_API[emp.role],
          password: 'ChangeMe123!',
        });
      }
      await loadEmployees();
    } catch (err) {
      // Offline fallback — mutate local state
      if (selected) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
      } else {
        setEmployees(prev => [...prev, { ...emp, id: Date.now().toString() }]);
      }
    } finally {
      setSaving(false);
      handleClose();
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteEmployee(id);
      await loadEmployees();
    } catch {
      setEmployees(prev => prev.filter(e => e.id !== id));
    } finally {
      setSaving(false);
      handleClose();
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await resetEmployeePassword(id);
      alert('Password reset link sent to employee.');
    } catch {
      alert(`Password reset requested for employee ID: ${id}\n(API not reachable — no email sent)`);
    }
    handleClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-container">
      <Header title="Admin Dashboard">
        <button className="btn-primary" onClick={handleHireClick}>
          Hire new worker
        </button>
      </Header>

      {apiError && (
        <div style={{
          background: 'rgba(234,179,8,0.15)',
          border: '1px solid rgba(234,179,8,0.4)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '16px',
          color: '#fde047',
          fontSize: '14px',
          flexShrink: 0,
        }}>
          ⚠ {apiError}
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ color: '#fff', padding: '40px', textAlign: 'center', opacity: 0.6 }}>
            Loading employees…
          </div>
        ) : (
          <table className="employee-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.fullName}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.role}</td>
                  <td>
                    <button
                      className="btn-edit"
                      disabled={emp.role === 'Admin' || saving}
                      onClick={() => handleEditClick(emp)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EmployeeModal
        isOpen={isModalOpen}
        employee={selected}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={handleDelete}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
}
