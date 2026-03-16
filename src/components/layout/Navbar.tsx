import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const roleName: string = user?.role
    ? (typeof user.role === 'object' ? (user.role as any).roleName ?? '' : String(user.role))
    : '';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
      height: 60, backgroundColor: '#1976d2',
      display: 'flex', alignItems: 'center', padding: '0 16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }}>
      <span
        style={{ flex: 1, color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        Data Labeling Support System
      </span>

      {isAuthenticated ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
            }}
          >
            {user?.username} {roleName ? `(${roleName})` : ''} ▾
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '110%',
              background: '#fff', borderRadius: 8, minWidth: 160,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden',
            }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '10px 16px', background: 'none',
                  border: 'none', textAlign: 'left', cursor: 'pointer',
                  fontSize: 14, color: '#dc2626',
                }}
              >
                🚪 Đăng xuất
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            }}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: '#fff', border: 'none', color: '#1976d2',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Đăng ký
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
