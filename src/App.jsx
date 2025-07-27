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
import FileStorageModule from './components/modules/FileStorageModule';
import ProjectList from './components/projects/ProjectList';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UserManagement from './components/user/UserManagement';
import CompanySettings from './components/user/CompanySettings';
import UserProfile from './components/user/UserProfile';
import { ProjectProvider } from './contexts/ProjectContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ChatProvider } from './contexts/ChatContext';
import { FileStorageProvider } from './contexts/FileStorageContext';
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
  const { currentUser } = useAuth();

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
          <Route path="/login" element={currentUser ? <Navigate to="/projects" replace /> : <LoginPage />} />
          <Route path="/register" element={currentUser ? <Navigate to="/projects" replace /> : <RegisterPage />} />
          <Route path="/reset-password" element={currentUser ? <Navigate to="/projects" replace /> : <ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="*"
            element={
              currentUser ? (
                <>
                  <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
                  <div className="flex">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
                    <main className={`flex-1 transition-all duration-300 ${!isMobile && sidebarOpen ? 'ml-64' : ''}`}>
                      <div className="p-4 md:p-6 pt-28 md:pt-32">
                        <Routes>
                          <Route path="/" element={<Navigate to="/projects" replace />} />
                          <Route path="/projects" element={<ProjectList />} />
                          <Route path="/project/:id" element={<ProjectCockpit />} />
                          <Route path="/project/:id/measurement" element={<MeasurementModule />} />
                          <Route path="/project/:id/calculation" element={<CalculationModule />} />
                          <Route path="/project/:id/plan" element={<ProjectPlanModule />} />
                          <Route path="/project/:id/chat" element={<ChatModule />} />
                          <Route path="/project/:id/files" element={<FileStorageModule />} />
                          <Route path="/planning" element={<GlobalPlanningModule />} />
                          <Route path="/settings" element={<SettingsModule />} />
                          <Route path="/users" element={<UserManagement />} />
                          <Route path="/company" element={<CompanySettings />} />
                          <Route path="/profile" element={<UserProfile />} />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
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
            <FileStorageProvider>
              <AppContent />
            </FileStorageProvider>
          </ChatProvider>
        </ProjectProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;