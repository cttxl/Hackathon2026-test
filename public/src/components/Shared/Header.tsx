import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UIEmployee as Employee } from '../../types/api';
import './Header.css';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

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

  if (!currentUser) return null;

  return (
    <>
      <div className="header-container">
        <h2 className="header-title">{title}</h2>

        <div className="header-right">
          {children} {/* Allows injection of buttons like "Hire new worker" */}

          <div className="user-label">{currentUser.fullName}</div>

          <button
            className="btn-secondary btn-logout"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
