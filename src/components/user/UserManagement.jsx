import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiUser, FiMail, FiClock, 
  FiUserPlus, FiAlertCircle, FiAlertTriangle, FiUserCheck, FiShield 
} = FiIcons;

const UserManagement = () => {
  const {
    currentCompany,
    getCompanyUsers,
    getCompanyInvitations,
    inviteUser,
    removeUser,
    changeUserRole,
    revokeInvitation,
    getAvailableRoles,
    hasPermission
  } = useAuth();

  const [users, setUsers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee'
  });
  const [newRole, setNewRole] = useState('');

  const availableRoles = getAvailableRoles();

  useEffect(() => {
    if (currentCompany) {
      loadUsers();
    }
  }, [currentCompany]);

  const loadUsers = () => {
    const companyUsers = getCompanyUsers();
    const invitations = getCompanyInvitations();
    setUsers(companyUsers);
    setPendingInvitations(invitations);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await inviteUser(formData.email, formData.role);
      setSuccess('Einladung erfolgreich versendet.');
      setFormData({ email: '', role: 'employee' });
      setShowInviteForm(false);
      loadUsers(); // Aktualisiere die Listen
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await changeUserRole(selectedUser.id, newRole);
      setSuccess(`Die Rolle von ${selectedUser.name} wurde erfolgreich geändert.`);
      setShowRoleForm(false);
      setSelectedUser(null);
      setNewRole('');
      loadUsers(); // Aktualisiere die Listen
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRemoveUser = async (user) => {
    if (window.confirm(`Sind Sie sicher, dass Sie ${user.name} aus Ihrer Firma entfernen möchten?`)) {
      try {
        await removeUser(user.id);
        setSuccess(`${user.name} wurde erfolgreich aus der Firma entfernt.`);
        loadUsers(); // Aktualisiere die Listen
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    if (window.confirm(`Sind Sie sicher, dass Sie die Einladung an ${invitation.email} zurückziehen möchten?`)) {
      try {
        await revokeInvitation(invitation.id);
        setSuccess(`Die Einladung an ${invitation.email} wurde zurückgezogen.`);
        loadUsers(); // Aktualisiere die Listen
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role.id);
    setShowRoleForm(true);
  };

  const resetForms = () => {
    setShowInviteForm(false);
    setShowRoleForm(false);
    setSelectedUser(null);
    setNewRole('');
    setFormData({ email: '', role: 'employee' });
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeClass = (roleId) => {
    switch (roleId) {
      case 'administrator': return 'bg-red-100 text-red-800';
      case 'foreman': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  // Prüfe, ob der Nutzer die Berechtigung hat, diese Seite zu sehen
  if (!hasPermission('users', 'view')) {
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
                Sie haben nicht die erforderlichen Berechtigungen, um die Nutzerverwaltung zu verwenden. 
                Bitte kontaktieren Sie Ihren Administrator.
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
          <h2 className="text-lg font-semibold text-gray-900">Nutzerverwaltung</h2>
          <p className="text-gray-600">Verwalten Sie Ihre Teammitglieder und deren Berechtigungen</p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          disabled={!hasPermission('users', 'invite')}
          className={`
            bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors 
            flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Mitarbeiter einladen</span>
        </button>
      </div>

      {/* Statusmeldungen */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-start"
        >
          <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
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

      {/* Einladungsformular */}
      {showInviteForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6 mb-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Neuen Mitarbeiter einladen</h3>
          
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@beispiel.de"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rolle *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                      {role.description && ` - ${role.description}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <SafeIcon icon={FiMail} className="h-5 w-5 text-blue-400 mr-2" />
                <div>
                  <p className="text-sm text-blue-700">
                    Der Eingeladene erhält eine E-Mail mit einem Einladungslink, der 7 Tage gültig ist. 
                    Nachdem er die Einladung angenommen hat, wird er als Nutzer zu Ihrer Firma hinzugefügt.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForms}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
                <span>Abbrechen</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiUserPlus} className="w-4 h-4" />
                <span>Einladen</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Rollen-Änderungsformular */}
      {showRoleForm && selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6 mb-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rolle ändern</h3>
          
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiUser} className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neue Rolle *
                </label>
                <select
                  required
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                      {role.description && ` - ${role.description}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex">
                <SafeIcon icon={FiAlertTriangle} className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-700">
                    Die Änderung der Rolle ändert die Berechtigungen des Nutzers sofort. 
                    Stellen Sie sicher, dass Sie die richtige Rolle auswählen.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForms}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
                <span>Abbrechen</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiShield} className="w-4 h-4" />
                <span>Rolle ändern</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Aktive Nutzer */}
      <div className="mb-8">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Aktive Nutzer ({users.length})</h3>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nutzer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Letzter Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <SafeIcon icon={FiUser} className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role.id)}`}>
                        {user.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditRole(user)}
                          disabled={!hasPermission('users', 'edit')}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SafeIcon icon={FiEdit2} className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user)}
                          disabled={!hasPermission('users', 'delete')}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SafeIcon icon={FiTrash2} className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      Keine aktiven Nutzer gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ausstehende Einladungen */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-4">Ausstehende Einladungen ({pendingInvitations.length})</h3>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-Mail
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesendet
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gültig bis
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <SafeIcon icon={FiMail} className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(invitation.role.id)}`}>
                        {invitation.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invitation.invitedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invitation.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRevokeInvitation(invitation)}
                        disabled={!hasPermission('users', 'delete')}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <SafeIcon icon={FiX} className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingInvitations.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Keine ausstehenden Einladungen
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lizenzinformationen */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-md font-semibold text-blue-900 mb-2 flex items-center">
          <SafeIcon icon={FiUserCheck} className="w-5 h-5 mr-2" />
          Lizenzinformationen
        </h3>
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Aktives Paket:</span> {currentCompany?.subscriptionPlan.name}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Maximale Nutzer:</span> {currentCompany?.subscriptionPlan.maxUsers}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Genutzte Lizenzen:</span> {users.length + pendingInvitations.length} von {currentCompany?.subscriptionPlan.maxUsers}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Verfügbare Lizenzen:</span> {Math.max(0, currentCompany?.subscriptionPlan.maxUsers - (users.length + pendingInvitations.length))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;