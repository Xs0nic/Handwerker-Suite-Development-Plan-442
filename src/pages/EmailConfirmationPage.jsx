import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheckCircle, FiAlertCircle, FiMail, FiRefreshCw } = FiIcons;

const EmailConfirmationPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('confirming'); // 'confirming', 'success', 'error'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { confirmEmail, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      handleConfirmation();
    } else {
      setStatus('error');
      setError('Ungültiger Bestätigungslink');
    }
  }, [token]);

  const handleConfirmation = async () => {
    try {
      setStatus('confirming');
      await confirmEmail(token);
      setStatus('success');
      
      // Nach 3 Sekunden automatisch zur Projektübersicht weiterleiten
      setTimeout(() => {
        navigate('/projects');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setError(error.message);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      // Hier müssten wir die E-Mail aus dem Token extrahieren oder anders handhaben
      // Für die Demo zeigen wir eine entsprechende Meldung
      setError('Bitte verwenden Sie das Registrierungsformular erneut, um eine neue Bestätigungs-E-Mail zu erhalten.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'confirming') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className="animate-spin mx-auto h-12 w-12 text-blue-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">E-Mail wird bestätigt...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment.</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100">
            <SafeIcon icon={FiCheckCircle} className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">E-Mail bestätigt!</h2>
          <p className="text-gray-600 mb-6">
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie werden automatisch zu Ihren Projekten weitergeleitet.
          </p>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-green-700">
              🎉 Willkommen bei Meister-Suite! Sie können jetzt alle Funktionen Ihrer 30-Tage-Testversion nutzen.
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Zu den Projekten
          </Link>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
            <SafeIcon icon={FiAlertCircle} className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bestätigung fehlgeschlagen</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <SafeIcon icon={FiMail} className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800 mb-1">Neue Bestätigungs-E-Mail anfordern</p>
                <p className="text-sm text-blue-700">
                  Wenn Ihr Bestätigungslink abgelaufen ist, können Sie sich erneut registrieren, um eine neue E-Mail zu erhalten.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link
              to="/register"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <SafeIcon icon={FiRefreshCw} className="mr-2 h-4 w-4" />
              Erneut registrieren
            </Link>
            <Link
              to="/login"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Zum Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default EmailConfirmationPage;