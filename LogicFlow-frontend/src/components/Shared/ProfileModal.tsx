import { useState, FormEvent, useEffect } from 'react';
import { Employee } from '../../data/mockEmployees';

interface ProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (email: string, phone: string) => void;
  onResetPassword: () => void;
}

export function ProfileModal({ employee, isOpen, onClose, onSave, onResetPassword }: ProfileModalProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (employee) {
      setEmail(employee.email);
      setPhone(employee.phone);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(email, phone);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">My Profile</h3>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Full Name (Locked)</label>
            <input 
              type="text" 
              value={employee.fullName}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Phone</label>
            <input 
              type="text" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginTop: '10px' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onResetPassword}
            >
              Reset Password
            </button>
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
