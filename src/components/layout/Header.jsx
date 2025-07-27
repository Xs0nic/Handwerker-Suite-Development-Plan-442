import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../contexts/AuthContext';
import GlobalChat from '../chat/GlobalChat';
import * as FiIcons from 'react-icons/fi';

const { FiMenu, FiHome, FiSettings, FiUser, FiLogOut, FiBriefcase, FiUsers, FiChevronDown, FiShield, FiCalendar, FiMessageSquare } = FiIcons;

const Header = ({ onMenuClick, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentCompany, logout, hasPermission } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showGlobalChat, setShowGlobalChat] = useState(false);

  const getPageTitle = () => {
    if (location.pathname === '/projects') return 'Projekte';
    if (location.pathname === '/planning') return 'Globale Projektplanung';
    if (location.pathname === '/settings') return 'Einstellungen';
    if (location.pathname === '/users') return 'Nutzerverwaltung';
    if (location.pathname === '/company') return 'Firmeneinstellungen';
    if (location.pathname === '/profile') return 'Mein Profil';
    if (location.pathname.includes('/project/')) {
      if (location.pathname.includes('/measurement')) return 'Aufmaß';
      if (location.pathname.includes('/calculation')) return 'Kalkulation';
      if (location.pathname.includes('/plan')) return 'Projektplan';
      if (location.pathname.includes('/chat')) return 'Chat';
      return 'Projekt-Cockpit';
    }
    return 'Meister-Suite';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (roleId) => {
    switch (roleId) {
      case 'administrator': return 'bg-red-100 text-red-800';
      case 'foreman': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4">
        {/* Left Section - Menu and Logo */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <SafeIcon icon={FiMenu} className="w-6 h-6 text-gray-600" />
          </button>
          
          <Link to="/projects" className="flex items-center space-x-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm md:text-lg">MS</span>
            </div>
            <span className="font-bold text-lg md:text-xl text-gray-900 hidden sm:block">
              Meister-Suite
            </span>
          </Link>
        </div>

        {/* Center Section - Page Title (Hidden on very small screens) */}
        <h1 className="text-sm md:text-xl font-semibold text-gray-900 truncate px-2 hidden xs:block">
          {getPageTitle()}
        </h1>

        {/* Right Section - Navigation and User */}
        <div className="flex items-center space-x-1 md:space-x-3">
          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <Link
                to="/projects"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
                title="Projekte"
              >
                <SafeIcon icon={FiHome} className="w-5 h-5 text-gray-600" />
              </Link>

              <button
                onClick={() => setShowGlobalChat(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
                title="Firmen-Chat"
              >
                <SafeIcon icon={FiMessageSquare} className="w-5 h-5 text-gray-600" />
              </button>

              {hasPermission('plans', 'view') && (
                <Link
                  to="/planning"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
                  title="Globale Planung"
                >
                  <SafeIcon icon={FiCalendar} className="w-5 h-5 text-gray-600" />
                </Link>
              )}

              {hasPermission('settings', 'view') && (
                <Link
                  to="/settings"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
                  title="Einstellungen"
                >
                  <SafeIcon icon={FiSettings} className="w-5 h-5 text-gray-600" />
                </Link>
              )}
            </>
          )}

          {/* User Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-1 md:space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-medium text-xs md:text-sm">
                    {currentUser.name.charAt(0)}
                  </span>
                </div>
                <span className="hidden md:block text-sm text-gray-700 font-medium max-w-[120px] truncate">
                  {currentUser.name}
                </span>
                <SafeIcon icon={FiChevronDown} className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop for mobile */}
                  {isMobile && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)}
                    />
                  )}
                  
                  <div className="absolute right-0 mt-2 w-64 md:w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* User Info */}
                    <div className="p-3 md:p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-gray-600 truncate">{currentUser.email}</p>
                      <div className="mt-2 flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(currentUser.role.id)}`}>
                          {currentUser.role.name}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="p-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
                      >
                        <SafeIcon icon={FiUser} className="w-4 h-4" />
                        <span>Mein Profil</span>
                      </Link>

                      {hasPermission('company', 'view') && (
                        <Link
                          to="/company"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
                        >
                          <SafeIcon icon={FiBriefcase} className="w-4 h-4" />
                          <span>Firmeneinstellungen</span>
                        </Link>
                      )}

                      {hasPermission('users', 'view') && (
                        <Link
                          to="/users"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
                        >
                          <SafeIcon icon={FiUsers} className="w-4 h-4" />
                          <span>Nutzerverwaltung</span>
                        </Link>
                      )}

                      {/* Mobile Navigation Links */}
                      {isMobile && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          
                          <Link
                            to="/projects"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left md:hidden"
                          >
                            <SafeIcon icon={FiHome} className="w-4 h-4" />
                            <span>Projekte</span>
                          </Link>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              setShowGlobalChat(true);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left md:hidden"
                          >
                            <SafeIcon icon={FiMessageSquare} className="w-4 h-4" />
                            <span>Firmen-Chat</span>
                          </button>

                          {hasPermission('plans', 'view') && (
                            <Link
                              to="/planning"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left md:hidden"
                            >
                              <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                              <span>Globale Planung</span>
                            </Link>
                          )}

                          {hasPermission('settings', 'view') && (
                            <Link
                              to="/settings"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left md:hidden"
                            >
                              <SafeIcon icon={FiSettings} className="w-4 h-4" />
                              <span>Einstellungen</span>
                            </Link>
                          )}
                        </>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="p-1 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full text-left"
                      >
                        <SafeIcon icon={FiLogOut} className="w-4 h-4" />
                        <span>Abmelden</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Chat Component */}
      <GlobalChat isOpen={showGlobalChat} onClose={() => setShowGlobalChat(false)} />
    </header>
  );
};

export default Header;