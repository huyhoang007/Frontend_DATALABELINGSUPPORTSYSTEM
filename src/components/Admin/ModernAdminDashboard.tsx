import React, { useState } from 'react';
import ModernAdminLayout from '../layout/ModernAdminLayout';
import ModernDashboardPage from '../../pages/Modern/ModernDashboardPage';
import ModernUsersPage from '../../pages/Modern/ModernUsersPage';
import ModernProjectsPage from '../../pages/Modern/ModernProjectsPage';
import ModernAssignmentsPage from '../../pages/Modern/ModernAssignmentsPage';
import ModernLabelsPage from '../../pages/Modern/ModernLabelsPage';
import ModernReviewingPage from '../../pages/Modern/ModernReviewingPage';
import ModernPoliciesPage from '../../pages/Modern/ModernPoliciesPage';
import ModernAuditPage from '../../pages/Modern/ModernAuditPage';
import ModernSettingsPage from '../../pages/Modern/ModernSettingsPage';

interface ModernAdminDashboardProps {
  user: any;
  onLogout: () => void;
}

const ModernAdminDashboard: React.FC<ModernAdminDashboardProps> = ({ user, onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <ModernDashboardPage />;
      case 'users':
        return <ModernUsersPage />;
      case 'projects':
        return <ModernProjectsPage />;
      case 'assignments':
        return <ModernAssignmentsPage />;
      case 'labels':
        return <ModernLabelsPage />;
      case 'reviewing':
        return <ModernReviewingPage />;
      case 'policies':
        return <ModernPoliciesPage />;
      case 'audit':
        return <ModernAuditPage />;
      case 'settings':
        return <ModernSettingsPage />;
      default:
        return <ModernDashboardPage />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background">
      <ModernAdminLayout
        currentUser={user}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={onLogout}
      >
        <div className="h-full overflow-auto bg-muted/5">
          {renderCurrentPage()}
        </div>
      </ModernAdminLayout>
    </div>
  );
};

export default ModernAdminDashboard;
