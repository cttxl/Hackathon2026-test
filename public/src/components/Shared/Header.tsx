import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UIEmployee as Employee } from '../../types/api';
import { ProfileModal } from './ProfileModal';
import './Header.css';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      // If no valid auth session, kick them out
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleSaveProfile = (email: string, phone: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, email, phone };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    setIsProfileOpen(false);
  };

  const handleResetPassword = () => {
    alert('A password reset link has been sent to your email.');
    setIsProfileOpen(false);
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="header-container">
        <h2 className="header-title">{title}</h2>

        <div className="header-right">
          {children} {/* Allows injection of buttons like "Hire new worker" */}

          <div className="user-label">{currentUser.fullName}</div>

          <button
            className="btn-secondary"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            Settings
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsProfileOpen(true);
                }}
              >
                Profile
              </button>
              <button
                className="dropdown-item danger"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        employee={currentUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleSaveProfile}
        onResetPassword={handleResetPassword}
      />
    </>
  );
}
