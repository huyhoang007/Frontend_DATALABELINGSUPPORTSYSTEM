import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import {
  Dashboard,
  People,
  Assignment,
  RateReview,
  Settings,
  Create,
  Visibility,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getMenuItems = () => {
    const role = user?.role.roleName;
    
    const commonItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    ];

    switch (role) {
      case 'ADMIN':
        return [
          ...commonItems,
          { text: 'Quản lý người dùng', icon: <People />, path: '/users' },
          { text: 'Cấu hình hệ thống', icon: <Settings />, path: '/settings' },
        ];
      
      case 'MANAGER':
        return [
          ...commonItems,
          { text: 'Quản lý dự án', icon: <Assignment />, path: '/projects' },
          { text: 'Tạo dự án mới', icon: <Create />, path: '/projects/create' },
          { text: 'Quản lý người dùng', icon: <People />, path: '/users' },
        ];
      
      case 'ANNOTATOR':
        return [
          ...commonItems,
          { text: 'Nhiệm vụ của tôi', icon: <Assignment />, path: '/my-tasks' },
          { text: 'Gán nhãn', icon: <Create />, path: '/annotate' },
        ];
      
      case 'REVIEWER':
        return [
          ...commonItems,
          { text: 'Kiểm duyệt', icon: <RateReview />, path: '/review' },
          { text: 'Xem dự án', icon: <Visibility />, path: '/projects/view' },
        ];
      
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  const handleItemClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: '64px', // Height of AppBar
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleItemClick(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
};

export default Sidebar;