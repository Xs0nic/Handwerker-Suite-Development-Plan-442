import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiEdit2, 
  FiCheck, 
  FiX, 
  FiBriefcase, 
  FiCreditCard,
  FiAlertTriangle,
  FiAlertCircle
} = FiIcons;

const CompanySettings = () => {
  const { 
    currentCompany, 
    updateCompanyDetails,
    changeSubscriptionPlan,
    getSubscriptionPlans,
    hasPermission
  } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: currentCompany?.name || ''
  });
  const [selectedPlan, setSelectedPlan] = useState(currentCompany?.subscriptionPlan?.id || '');

  const subscriptionPlans = getSubscriptionPlans();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateCompanyDetails(formData.name);
      setSuccess('Firmendetails wurden erfolgreich aktualisiert.');
      setEditMode(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await changeSubscriptionPlan(selectedPlan);
      setSuccess('Ihr Abonnement wurde erfolgreich geändert.');
      setShowSubscriptionForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const resetForms = () => {
    setEditMode(false);
    setShowSubscriptionForm(false);
    setFormData({ name: currentCompany?.name || '' });
    setSelectedPlan(currentCompany?.subscriptionPlan?.id || '');
    setError('');
  };

  // Prüfe, ob der Nutzer die Berechtigung hat, diese Seite zu sehen
  if (!hasPermission('company', 'view')) {
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
                Sie haben nicht die erforderlichen Berechtigungen, um die Firmeneinstellungen zu verwalten.
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
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Firmeneinstellungen</h2>
        <p className="text-gray-600">Verwalten Sie die Details und das Abonnement Ihrer Firma</p>
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

      {/* Firmendetails */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Firmendetails</h3>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              disabled={!hasPermission('company', 'edit')}
              className="text-blue-600 hover:text-blue-700 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Firmenname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Firmennamen eingeben"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
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
                  <SafeIcon icon={FiCheck} className="w-4 h-4" />
                  <span>Speichern</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiBriefcase} className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xl font-medium text-gray-900">{currentCompany?.name}</h4>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Abonnement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Abonnement</h3>
          {!showSubscriptionForm && (
            <button
              onClick={() => setShowSubscriptionForm(true)}
              disabled={!hasPermission('company', 'edit')}
              className="text-blue-600 hover:text-blue-700 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiEdit2} className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="p-6">
          {showSubscriptionForm ? (
            <form onSubmit={handleSubscriptionSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Wählen Sie Ihr Abonnement
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-colors
                        ${selectedPlan === plan.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">{plan.name}</h4>
                        {selectedPlan === plan.id && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <SafeIcon icon={FiCheck} className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{plan.price}</p>
                      <p className="text-sm text-gray-600 mb-3">{plan.period}</p>
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-sm">
                          <span className="font-semibold">Nutzer:</span> {plan.maxUsers}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex">
                  <SafeIcon icon={FiAlertTriangle} className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <p className="text-sm text-yellow-700">
                      Hinweis: In dieser Demo-Version wird keine echte Zahlung durchgeführt. 
                      In einer produktiven Umgebung würde hier eine Zahlungsabwicklung integriert werden.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
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
                  <SafeIcon icon={FiCreditCard} className="w-4 h-4 mr-1" />
                  <span>Abonnement ändern</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiCreditCard} className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-medium text-gray-900">{currentCompany?.subscriptionPlan.name}</h4>
                  <p className="text-gray-600">{currentCompany?.subscriptionPlan.price} / {currentCompany?.subscriptionPlan.period}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Details</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Maximale Nutzer:</span> {currentCompany?.subscriptionPlan.maxUsers}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Abonnement-Status:</span> Aktiv
                    </p>
                  </div>
                  <div>
                    {currentCompany?.subscriptionPlan.id === 'trial' && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Testversion endet am:</span> {
                          new Date(currentCompany?.subscriptionEndDate).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        }
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Zahlungsmethode:</span> Demo-Modus (keine echte Zahlung)
                    </p>
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

export default CompanySettings;