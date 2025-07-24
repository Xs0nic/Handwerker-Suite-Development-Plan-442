import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiAlertTriangle, FiHome, FiLogOut } = FiIcons;

const UnauthorizedPage = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-yellow-100">
          <SafeIcon icon={FiAlertTriangle} className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h2>
        <p className="text-gray-600 mb-6">
          Sie haben nicht die erforderlichen Berechtigungen, um auf diese Seite zuzugreifen.
          Bitte kontaktieren Sie Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
          <Link 
            to="/projects"
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <SafeIcon icon={FiHome} className="mr-2 h-4 w-4" />
            Zur Startseite
          </Link>
          <button 
            onClick={handleLogout}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <SafeIcon icon={FiLogOut} className="mr-2 h-4 w-4" />
            Abmelden
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;