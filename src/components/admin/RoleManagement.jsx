import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShield, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiAlertTriangle, FiUsers, FiLock } = FiIcons;

const RoleManagement = () => {
  const { 
    getAvailableRoles, 
    createCustomRole, 
    updateRole, 
    deleteRole, 
    hasPermission,
    getPermissionModules,
    currentUser 
  } = useAuth();
  
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {}
  });

  const permissionModules = getPermissionModules();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = () => {
    const availableRoles = getAvailableRoles();
    setRoles(availableRoles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        setSuccess('Rolle erfolgreich aktualisiert.');
      } else {
        await createCustomRole(formData);
        setSuccess('Rolle erfolgreich erstellt.');
      }
      resetForm();
      loadRoles();
    } catch (error) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: {}
    });
    setShowForm(false);
    setEditingRole(null);
    setError('');
  };

  const handleEdit = (role) => {
    if (role.isSystem) {
      setError('Systemrollen können nicht bearbeitet werden.');
      return;
    }
    
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions
    });
    setShowForm(true);
  };

  const handleDelete = async (role) => {
    if (role.isSystem) {
      setError('Systemrollen können nicht gelöscht werden.');
      return;
    }

    if (window.confirm(`Sind Sie sicher, dass Sie die Rolle "${role.name}" löschen möchten?`)) {
      try {
        await deleteRole(role.id);
        setSuccess('Rolle erfolgreich gelöscht.');
        loadRoles();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handlePermissionChange = (module, action, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: value
        }
      }
    }));
  };

  const getPermissionValue = (module, action) => {
    return formData.permissions[module]?.[action] || false;
  };

  // Prüfe, ob der Nutzer die Berechtigung hat, Rollen zu verwalten
  if (!hasPermission('users', 'edit') || currentUser?.role?.id !== 'administrator') {
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
                Nur Administratoren können Rollen verwalten.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rollen verwalten</h2>
          <p className="text-gray-600">Erstellen und verwalten Sie benutzerdefinierte Rollen mit spezifischen Berechtigungen</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Neue Rolle</span>
        </button>
      </div>

      {/* Statusmeldungen */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-start"
        >
          <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Fehler</p>
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-start"
        >
          <SafeIcon icon={FiCheck} className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erfolgreich</p>
            <p>{success}</p>
          </div>
        </motion.div>
      )}

      {/* Rollenformular */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6 mb-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingRole ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rollenname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Projektleiter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kurze Beschreibung der Rolle"
                />
              </div>
            </div>

            {/* Berechtigungen */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Berechtigungen</h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modul
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Anzeigen
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erstellen
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bearbeiten
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Löschen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {permissionModules.map((module) => (
                      <tr key={module.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {module.name}
                        </td>
                        {['view', 'create', 'edit', 'delete'].map((action) => (
                          <td key={action} className="px-6 py-4 whitespace-nowrap text-center">
                            {module.actions.includes(action) ? (
                              <input
                                type="checkbox"
                                checked={getPermissionValue(module.id, action)}
                                onChange={(e) => handlePermissionChange(module.id, action, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
                <span>Abbrechen</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiCheck} className="w-4 h-4" />
                <span>{editingRole ? 'Aktualisieren' : 'Erstellen'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Rollenliste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiShield} className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{role.name}</h3>
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}
                  {role.isSystem && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                      <SafeIcon icon={FiLock} className="w-3 h-3 mr-1" />
                      Systemrolle
                    </span>
                  )}
                </div>
              </div>
              
              {!role.isSystem && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Berechtigungsübersicht */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Berechtigungen:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(role.permissions).map(([module, permissions]) => {
                  const activePermissions = Object.entries(permissions)
                    .filter(([, value]) => value)
                    .map(([action]) => action);
                  
                  if (activePermissions.length === 0) return null;
                  
                  return (
                    <div key={module} className="text-xs">
                      <span className="font-medium text-gray-600 capitalize">{module}:</span>
                      <div className="text-gray-500">
                        {activePermissions.join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nutzeranzahl */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <SafeIcon icon={FiUsers} className="w-4 h-4 mr-1" />
                <span>{role.userCount || 0} Nutzer</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <SafeIcon icon={FiShield} className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Keine Rollen definiert</p>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;