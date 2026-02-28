import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {isAuthenticated && (
          <>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleSidebarToggle}
              sx={{
                position: 'fixed',
                top: 70,
                left: 10,
                zIndex: 1200,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </>
        )}
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            marginTop: isAuthenticated ? '60px' : '0',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;