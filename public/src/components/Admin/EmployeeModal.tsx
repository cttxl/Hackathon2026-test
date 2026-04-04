import { useState, FormEvent, useEffect } from 'react';
import type { UIEmployee as Employee } from '../../types/api';
import '../../pages/AdminPage.css';

interface EmployeeModalProps {
  employee?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: Employee) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
}

export function EmployeeModal({ employee, isOpen, onClose, onSave, onDelete, onResetPassword }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: 'Warehouse Operator'
      });
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!employee;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData as Employee);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{isEditing ? 'Edit Employee' : 'Create New Employee'}</h3>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Phone</label>
            <input
              type="text"
              required
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Role</label>
            <select
              className="select-input"
              value={formData.role || 'Warehouse Operator'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <option value="Admin">Admin</option>
              <option value="Logist">Logist</option>
              <option value="Driver">Driver</option>
              <option value="Warehouse Operator">Warehouse Operator</option>
            </select>
          </div>

          {isEditing && (
            <div className="input-group" style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onResetPassword(employee.id)}
              >
                Reset Password
              </button>
            </div>
          )}

          <div className="modal-actions">
            {isEditing && (
              <button
                type="button"
                className="btn-secondary btn-danger"
                onClick={() => onDelete(employee.id)}
                style={{ marginRight: 'auto' }}
              >
                Delete employee
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
