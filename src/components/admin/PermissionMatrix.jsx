import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGrid, FiUser, FiCheck, FiX, FiAlertTriangle, FiFilter } = FiIcons;

const PermissionMatrix = () => {
  const { 
    getAvailableRoles, 
    getPermissionModules, 
    hasPermission,
    currentUser,
    getCompanyUsers 
  } = useAuth();
  
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const availableRoles = getAvailableRoles();
    const permissionModules = getPermissionModules();
    const companyUsers = getCompanyUsers();
    
    setRoles(availableRoles);
    setModules(permissionModules);
    setUsers(companyUsers);
  };

  const getFilteredRoles = () => {
    if (selectedRole === 'all') return roles;
    return roles.filter(role => role.id === selectedRole);
  };

  const getFilteredModules = () => {
    if (selectedModule === 'all') return modules;
    return modules.filter(module => module.id === selectedModule);
  };

  const hasRolePermission = (role, moduleId, action) => {
    return role.permissions[moduleId]?.[action] || false;
  };

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 'administrator': return 'bg-red-100 text-red-800';
      case 'foreman': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const getUsersByRole = (roleId) => {
    return users.filter(user => user.role.id === roleId).length;
  };

  // Prüfe, ob der Nutzer die Berechtigung hat, die Matrix zu sehen
  if (!hasPermission('users', 'view') || currentUser?.role?.id !== 'administrator') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <SafeIcon icon={FiAlertTriangle} className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Zugriff verweigert
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Nur Administratoren können die Berechtigungsmatrix einsehen.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Berechtigungsmatrix</h2>
        <p className="text-gray-600">Übersicht aller Rollen und deren Berechtigungen</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiFilter} className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rolle
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Alle Rollen</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Modul
              </label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Alle Module</option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rollenübersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {getFilteredRoles().map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{role.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.id)}`}>
                {getUsersByRole(role.id)} Nutzer
              </span>
            </div>
            
            <div className="space-y-2">
              {getFilteredModules().map((module) => {
                const modulePermissions = role.permissions[module.id] || {};
                const activePermissions = Object.entries(modulePermissions)
                  .filter(([, value]) => value)
                  .length;
                const totalPermissions = module.actions.length;
                
                return (
                  <div key={module.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{module.name}</span>
                    <span className="text-gray-900 font-medium">
                      {activePermissions}/{totalPermissions}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detaillierte Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <SafeIcon icon={FiGrid} className="w-5 h-5 mr-2" />
            Detaillierte Berechtigungsmatrix
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                {getFilteredModules().map((module) => (
                  <th key={module.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {module.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredRoles().map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <SafeIcon icon={FiUser} className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                        <div className="text-xs text-gray-500">{getUsersByRole(role.id)} Nutzer</div>
                      </div>
                    </div>
                  </td>
                  {getFilteredModules().map((module) => (
                    <td key={module.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="space-y-1">
                        {module.actions.map((action) => {
                          const hasPermission = hasRolePermission(role, module.id, action);
                          return (
                            <div key={action} className="flex items-center justify-center space-x-1">
                              <span className="text-xs text-gray-600 capitalize w-12 text-left">
                                {action}:
                              </span>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                hasPermission ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                <SafeIcon 
                                  icon={hasPermission ? FiCheck : FiX} 
                                  className={`w-3 h-3 ${hasPermission ? 'text-green-600' : 'text-red-600'}`} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legende */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Legende</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
              <SafeIcon icon={FiCheck} className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-600">Berechtigung vorhanden</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
              <SafeIcon icon={FiX} className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-gray-600">Keine Berechtigung</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Administrator
            </span>
            <span className="text-gray-600">Vollzugriff</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Mitarbeiter
            </span>
            <span className="text-gray-600">Eingeschränkt</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;