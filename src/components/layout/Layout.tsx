import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, marginTop: 60 }}>
        {isAuthenticated && (
          <>
            <button
              aria-label="open drawer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                position: 'fixed', top: 70, left: 10, zIndex: 1200,
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: '#1976d2', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ☰
            </button>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </>
        )}

        <main style={{ flexGrow: 1, padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
