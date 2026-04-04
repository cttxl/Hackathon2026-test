import { useState, FormEvent, useEffect } from 'react';
import type { UIEmployee as Employee } from '../../types/api';
import '../../pages/AdminPage.css';

interface EmployeeModalProps {
  employee?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: Employee, password?: string) => void;
  onDelete: (id: string) => void;
}

export function EmployeeModal({ employee, isOpen, onClose, onSave, onDelete }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    setPassword('');
    setConfirmPassword('');
    setError(null);
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!employee;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    onSave(formData as Employee, password || undefined);
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

          <div className="input-group">
            <label>{isEditing ? 'Change Password' : 'Password'}</label>
            <input
              type="password"
              placeholder={isEditing ? 'Enter new password to change' : 'Enter password'}
              required={!isEditing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="input-group">
            <label>Confirm {isEditing ? 'New ' : ''}Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              required={!isEditing || !!password}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '-8px', marginBottom: '16px' }}>
              {error}
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
