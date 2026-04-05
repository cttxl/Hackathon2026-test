import { useState, FormEvent, useEffect } from 'react';
import '../../pages/AdminPage.css';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: { name: string; email: string; phone: string; password?: string }) => void;
}

export function ClientModal({ isOpen, onClose, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', phone: '', password: '' });
      setConfirmPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.phone.startsWith('+')) {
      setError('Phone number must start with + (e.g. +380...)');
      return;
    }
    onSave({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password || undefined
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Create New Client</h3>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Company/Client Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Phone (must start with +)</label>
            <input
              type="text"
              required
              placeholder="+380991234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="new-password"
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              required
              placeholder="Confirm password"
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
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
