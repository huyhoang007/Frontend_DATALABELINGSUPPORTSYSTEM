import React, { useState } from 'react';
import ModernLoginForm from './components/Auth/ModernLoginForm';
import ModernRegisterForm from './components/Auth/ModernRegisterForm';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import AnnotatorDashboard from './pages/Annotator/AnnotatorDashboard';
import ReviewerDashboard from './pages/Reviewer/ReviewerDashboard';

type AppState = 'login' | 'register' | 'dashboard';

const ModernAdminApp: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (email: string, password: string) => {
    // Simulate login - determine role based on email
    let role = 'annotator';
    if (email.includes('admin')) role = 'admin';
    else if (email.includes('manager')) role = 'manager';
    else if (email.includes('reviewer')) role = 'reviewer';

    const mockUser = {
      user_id: 1,
      username: email.split('@')[0],
      email: email,
      full_name: 'User Demo',
      role: role,
      status: 'active',
      role_id: role === 'admin' ? 1 : role === 'manager' ? 2 : role === 'reviewer' ? 4 : 3,
      created_at: new Date().toISOString()
    };
    
    console.log('Login with role:', role, 'password:', password.length > 0 ? 'provided' : 'empty');
    setUser(mockUser);
    setCurrentState('dashboard');
  };

  const handleRegister = (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const mockUser = {
      user_id: 1,
      username: userData.email.split('@')[0],
      email: userData.email,
      full_name: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      status: 'active',
      role_id: userData.role === 'admin' ? 1 : userData.role === 'manager' ? 2 : userData.role === 'reviewer' ? 4 : 3,
      created_at: new Date().toISOString()
    };
    
    setUser(mockUser);
    setCurrentState('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentState('login');
  };

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      case 'manager':
        return <ManagerDashboard user={user} onLogout={handleLogout} />;
      case 'annotator':
        return <AnnotatorDashboard user={user} onLogout={handleLogout} />;
      case 'reviewer':
        return <ReviewerDashboard user={user} onLogout={handleLogout} />;
      default:
        return <AnnotatorDashboard user={user} onLogout={handleLogout} />;
    }
  };

  if (currentState === 'dashboard' && user) {
    return renderDashboard();
  }

  if (currentState === 'register') {
    return (
      <ModernRegisterForm
        onRegister={handleRegister}
        onSwitchToLogin={() => setCurrentState('login')}
      />
    );
  }

  return (
    <ModernLoginForm
      onLogin={handleLogin}
      onSwitchToRegister={() => setCurrentState('register')}
    />
  );
};

export default ModernAdminApp;