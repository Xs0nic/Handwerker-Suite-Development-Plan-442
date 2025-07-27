import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import GlobalChat from '../chat/GlobalChat';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiClipboard, FiCalculator, FiSettings, FiX, FiFolder, FiMessageSquare, FiCalendar, FiUsers, FiBriefcase, FiUser } = FiIcons;

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const { id: projectId } = useParams();
  const { getUnreadCount, getLastMessage } = useChat();
  const { hasPermission, currentUser } = useAuth();
  const [showGlobalChat, setShowGlobalChat] = useState(false);

  // Hauptmenüpunkte
  const mainMenuItems = [
    { path: '/projects', icon: FiHome, label: 'Projekte' },
    { path: '/planning', icon: FiCalendar, label: 'Globale Planung', permission: { module: 'plans', action: 'view' } }
  ];

  // Projektspezifische Menüpunkte
  const projectMenuItems = projectId ? [
    { path: `/project/${projectId}`, icon: FiFolder, label: 'Projekt-Cockpit' },
    { path: `/project/${projectId}/measurement`, icon: FiClipboard, label: 'Aufmaß', permission: { module: 'measurements', action: 'view' } },
    { path: `/project/${projectId}/calculation`, icon: FiCalculator, label: 'Kalkulation', permission: { module: 'calculations', action: 'view' } },
    { path: `/project/${projectId}/plan`, icon: FiCalendar, label: 'Projektplan', permission: { module: 'plans', action: 'view' } },
    { path: `/project/${projectId}/chat`, icon: FiMessageSquare, label: 'Chat', badge: getUnreadCount(projectId, localStorage.getItem(`meister-chat-lastread-${projectId}`)), permission: { module: 'chat', action: 'view' } },
    { path: `/project/${projectId}/files`, icon: FiFolder, label: 'Dateiablage', permission: { module: 'files', action: 'view' } }
  ] : [];

  // Einstellungen und Verwaltung
  const settingsMenuItems = [
    { path: '/settings', icon: FiSettings, label: 'Einstellungen', permission: { module: 'settings', action: 'view' } },
    { path: '/users', icon: FiUsers, label: 'Nutzerverwaltung', permission: { module: 'users', action: 'view' } },
    { path: '/company', icon: FiBriefcase, label: 'Firmeneinstellungen', permission: { module: 'company', action: 'view' } },
    { path: '/profile', icon: FiUser, label: 'Mein Profil' }
  ];

  // Filtere Menüpunkte nach Berechtigungen
  const filterByPermission = (items) => {
    return items.filter(item => {
      if (!item.permission) return true;
      return hasPermission(item.permission.module, item.permission.action);
    });
  };

  const filteredMainMenu = filterByPermission(mainMenuItems);
  const filteredProjectMenu = projectId ? filterByPermission(projectMenuItems) : [];
  const filteredSettingsMenu = filterByPermission(settingsMenuItems);

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: -280 }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  if (!isMobile && !isOpen) return null;

  return (
    <AnimatePresence>
      {(isOpen || !isMobile) && (
        <>
          {isMobile && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={onClose}
            />
          )}

          <motion.aside
            initial={isMobile ? "closed" : "open"}
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`
              ${isMobile ? 'fixed' : 'fixed'} 
              top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 
              ${isMobile ? 'shadow-xl' : ''} 
              overflow-y-auto
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <Link to="/projects" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MS</span>
                </div>
                <span className="font-bold text-gray-900">Meister-Suite</span>
              </Link>
              {isMobile && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            <div className="p-2 pb-20">
              {/* Benutzerinfo */}
              {currentUser && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="text-blue-700 font-medium text-sm">
                        {currentUser.name.charAt(0)}
                      </span>
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium text-gray-900 text-sm truncate">{currentUser.name}</div>
                      <div className="text-xs text-gray-500 truncate">{currentUser.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Global Chat Button */}
              <div className="mb-4">
                <button
                  onClick={() => setShowGlobalChat(true)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiMessageSquare} className="w-5 h-5 text-green-700" />
                    <span className="font-medium">Firmen-Chat</span>
                  </div>
                </button>
              </div>

              {/* Hauptnavigation */}
              <div className="mb-4">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Navigation
                  </h3>
                </div>
                <nav className="space-y-1">
                  {filteredMainMenu.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={isMobile ? onClose : undefined}
                      className={`
                        flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                        ${location.pathname === item.path 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <SafeIcon 
                          icon={item.icon} 
                          className={`w-5 h-5 ${location.pathname === item.path ? 'text-blue-700' : 'text-gray-500'}`} 
                        />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Projektnavigation */}
              {projectId && filteredProjectMenu.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Aktuelles Projekt
                    </h3>
                  </div>
                  <nav className="space-y-1">
                    {filteredProjectMenu.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={isMobile ? onClose : undefined}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                          ${location.pathname === item.path 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <SafeIcon 
                            icon={item.icon} 
                            className={`w-5 h-5 ${location.pathname === item.path ? 'text-blue-700' : 'text-gray-500'}`} 
                          />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Einstellungen und Verwaltung */}
              <div>
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Einstellungen
                  </h3>
                </div>
                <nav className="space-y-1">
                  {filteredSettingsMenu.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={isMobile ? onClose : undefined}
                      className={`
                        flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                        ${location.pathname === item.path 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <SafeIcon 
                          icon={item.icon} 
                          className={`w-5 h-5 ${location.pathname === item.path ? 'text-blue-700' : 'text-gray-500'}`} 
                        />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {/* Chat Preview für aktuelles Projekt - Fixed Position */}
            {projectId && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <SafeIcon icon={FiMessageSquare} className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Letzte Nachricht</span>
                  </div>
                  {(() => {
                    const lastMessage = getLastMessage(projectId);
                    return lastMessage ? (
                      <div className="text-xs text-gray-600">
                        <div className="font-medium">{lastMessage.sender}</div>
                        <div className="truncate">{lastMessage.text}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">Noch keine Nachrichten</div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Global Chat Component */}
            <GlobalChat isOpen={showGlobalChat} onClose={() => setShowGlobalChat(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;