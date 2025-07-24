import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';

const { 
  FiMenu, 
  FiHome, 
  FiSettings, 
  FiUser, 
  FiLogOut, 
  FiBriefcase, 
  FiUsers, 
  FiChevronDown,
  FiShield,
  FiCalendar
} = FiIcons;

const Header = ({ onMenuClick, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentCompany, logout, hasPermission } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      case 'administrator':
        return 'bg-red-100 text-red-800';
      case 'foreman':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <SafeIcon icon={FiMenu} className="w-6 h-6 text-gray-600" />
          </button>
          <Link to="/projects" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">MS</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">
              Meister-Suite
            </span>
          </Link>
        </div>
        
        <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate px-4">
          {getPageTitle()}
        </h1>
        
        <div className="flex items-center space-x-2 md:space-x-3">
          {!isMobile && (
            <>
              <Link to="/projects" className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                <SafeIcon icon={FiHome} className="w-6 h-6 text-gray-600" />
              </Link>
              {hasPermission('plans', 'view') && (
                <Link to="/planning" className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <SafeIcon icon={FiCalendar} className="w-6 h-6 text-gray-600" />
                </Link>
              )}
              {hasPermission('settings', 'view') && (
                <Link to="/settings" className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <SafeIcon icon={FiSettings} className="w-6 h-6 text-gray-600" />
                </Link>
              )}
            </>
          )}

          {currentUser && (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-medium text-sm">
                    {currentUser.name.charAt(0)}
                  </span>
                </div>
                <span className="hidden md:block text-sm text-gray-700 font-medium">
                  {currentUser.name}
                </span>
                <SafeIcon icon={FiChevronDown} className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-600">{currentUser.email}</p>
                    <div className="mt-1 flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(currentUser.role.id)}`}>
                        {currentUser.role.name}
                      </span>
                    </div>
                  </div>
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
                  </div>
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
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;