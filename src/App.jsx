import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ProjectCockpit from './components/modules/ProjectCockpit';
import MeasurementModule from './components/modules/MeasurementModule';
import CalculationModule from './components/modules/CalculationModule';
import ChatModule from './components/modules/ChatModule';
import ProjectPlanModule from './components/modules/ProjectPlanModule';
import GlobalPlanningModule from './components/modules/GlobalPlanningModule';
import SettingsModule from './components/modules/SettingsModule';
import ProjectList from './components/projects/ProjectList';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InvitationPage from './pages/InvitationPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UserManagement from './components/user/UserManagement';
import CompanySettings from './components/user/CompanySettings';
import UserProfile from './components/user/UserProfile';
import { ProjectProvider } from './contexts/ProjectContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ChatProvider } from './contexts/ChatContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Komponente für geschützte Routen
const ProtectedRoute = ({ element, requiredPermission }) => {
  const { RequireAuth } = useAuth();
  return (
    <RequireAuth permissions={requiredPermission}>
      {element}
    </RequireAuth>
  );
};

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/invitation/:token" element={<InvitationPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={
            <>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
              <div className="flex">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
                <main className={`flex-1 transition-all duration-300 ${!isMobile && sidebarOpen ? 'ml-64' : ''}`}>
                  <div className="p-4 md:p-6 pt-28 md:pt-32">
                    <Routes>
                      <Route path="/" element={<Navigate to="/projects" replace />} />
                      <Route path="/projects" element={<ProtectedRoute element={<ProjectList />} />} />
                      <Route path="/project/:id" element={<ProtectedRoute element={<ProjectCockpit />} requiredPermission={{ module: 'projects', action: 'view' }} />} />
                      <Route path="/project/:id/measurement" element={<ProtectedRoute element={<MeasurementModule />} requiredPermission={{ module: 'measurements', action: 'view' }} />} />
                      <Route path="/project/:id/calculation" element={<ProtectedRoute element={<CalculationModule />} requiredPermission={{ module: 'calculations', action: 'view' }} />} />
                      <Route path="/project/:id/plan" element={<ProtectedRoute element={<ProjectPlanModule />} requiredPermission={{ module: 'plans', action: 'view' }} />} />
                      <Route path="/project/:id/chat" element={<ProtectedRoute element={<ChatModule />} requiredPermission={{ module: 'chat', action: 'view' }} />} />
                      <Route path="/planning" element={<ProtectedRoute element={<GlobalPlanningModule />} requiredPermission={{ module: 'plans', action: 'view' }} />} />
                      <Route path="/settings" element={<ProtectedRoute element={<SettingsModule />} requiredPermission={{ module: 'settings', action: 'view' }} />} />
                      <Route path="/users" element={<ProtectedRoute element={<UserManagement />} requiredPermission={{ module: 'users', action: 'view' }} />} />
                      <Route path="/company" element={<ProtectedRoute element={<CompanySettings />} requiredPermission={{ module: 'company', action: 'view' }} />} />
                      <Route path="/profile" element={<ProtectedRoute element={<UserProfile />} />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ProjectProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </ProjectProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;