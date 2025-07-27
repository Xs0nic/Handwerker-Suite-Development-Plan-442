import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import SettingsTab from '../settings/SettingsTab';
import TradesSettings from '../settings/TradesSettings';
import UnitsSettings from '../settings/UnitsSettings';
import RoomsSettings from '../settings/RoomsSettings';
import FloorsSettings from '../settings/FloorsSettings';
import MaterialsSettings from '../settings/MaterialsSettings';
import EmployeesSettings from '../settings/EmployeesSettings';
import RoleManagement from '../admin/RoleManagement';
import PermissionMatrix from '../admin/PermissionMatrix';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBriefcase, FiHash, FiHome, FiLayers, FiPackage, FiUsers, FiShield, FiGrid } = FiIcons;

const SettingsModule = () => {
  const [activeTab, setActiveTab] = useState('trades');
  const { hasPermission, currentUser } = useAuth();

  const tabs = [
    { id: 'trades', label: 'Gewerke', icon: FiBriefcase },
    { id: 'units', label: 'Einheiten', icon: FiHash },
    { id: 'rooms', label: 'Räume', icon: FiHome },
    { id: 'floors', label: 'Etagen', icon: FiLayers },
    { id: 'materials', label: 'Materialien', icon: FiPackage },
    { id: 'employees', label: 'Mitarbeiter', icon: FiUsers }
  ];

  // Administratoren-spezifische Tabs
  if (hasPermission('roles', 'view') && currentUser?.role?.id === 'administrator') {
    tabs.push(
      { id: 'roles', label: 'Rollen', icon: FiShield },
      { id: 'permissions', label: 'Berechtigungen', icon: FiGrid }
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trades':
        return <TradesSettings />;
      case 'units':
        return <UnitsSettings />;
      case 'rooms':
        return <RoomsSettings />;
      case 'floors':
        return <FloorsSettings />;
      case 'materials':
        return <MaterialsSettings />;
      case 'employees':
        return <EmployeesSettings />;
      case 'roles':
        return <RoleManagement />;
      case 'permissions':
        return <PermissionMatrix />;
      default:
        return <TradesSettings />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-gray-600 mt-1">
          Konfigurieren Sie Ihre Vorlagen, Materialien, Mitarbeiter und Berechtigungen
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <SafeIcon icon={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsModule;