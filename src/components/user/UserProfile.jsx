import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiUser, 
  FiMail, 
  FiBriefcase, 
  FiShield,
  FiEdit2,
  FiCheck,
  FiX,
  FiLock,
  FiAlertCircle
} = FiIcons;

const UserProfile = () => {
  const { currentUser, currentCompany, updateUserProfile } = useAuth();
  
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.currentPassword) {
      setError('Bitte geben Sie Ihr aktuelles Passwort ein.');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 8) {
      setError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    try {
      await updateUserProfile(
        formData.name,
        formData.currentPassword,
        formData.newPassword || null
      );
      setSuccess('Ihr Profil wurde erfolgreich aktualisiert.');
      setEditMode(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setFormData({
      name: currentUser?.name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
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
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Mein Profil</h2>
        <p className="text-gray-600">Verwalten Sie Ihre persönlichen Daten und Passwort</p>
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

      {/* Profildetails */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Persönliche Daten</h3>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-blue-600 hover:text-blue-700 p-2"
            >
              <SafeIcon icon={FiEdit2} className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="p-6">
          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ihr Name"
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Passwort ändern</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aktuelles Passwort *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Neues Passwort
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Leer lassen, wenn unverändert"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Das Passwort muss mindestens 8 Zeichen lang sein.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Neues Passwort bestätigen
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Passwort wiederholen"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
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
                  <span>Speichern</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiUser} className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-medium text-gray-900">{currentUser?.name}</h4>
                  <p className="text-gray-600">{currentUser?.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Firma</p>
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiBriefcase} className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{currentCompany?.name}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Rolle</p>
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiShield} className="w-4 h-4 text-gray-400" />
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(currentUser?.role.id)}`}>
                      {currentUser?.role.name}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">E-Mail</p>
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiMail} className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{currentUser?.email}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Passwort</p>
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiLock} className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">••••••••</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;