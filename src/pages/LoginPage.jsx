import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { FiLock, FiMail, FiLogIn, FiAlertCircle, FiInfo } = FiIcons;

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const { login, resetPassword, currentUser, session } = useAuth();
  const navigate = useNavigate();

  // Wenn bereits angemeldet, zur Projektliste weiterleiten
  useEffect(() => {
    if (session) {
      navigate('/projects');
    }
  }, [session, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting to log in with:', { email: formData.email });
      
      // Direkt mit Supabase einloggen
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Login error details:', error);
        throw error;
      }

      console.log('Login successful:', data);
      
      // Erfolgreich eingeloggt, zur Projektliste navigieren
      navigate('/projects');
    } catch (error) {
      console.error('Login error:', error);
      
      // Detaillierte Fehlermeldung für Debugging
      console.log('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      
      // Bessere Fehlermeldungen
      if (error.message?.includes('Invalid login credentials')) {
        setError('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort und beachten Sie die Groß- und Kleinschreibung.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.');
      } else {
        setError('Anmeldung fehlgeschlagen: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
    } catch (error) {
      setError(error.message || 'Fehler beim Zurücksetzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Funktion - für Testzwecke
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Verwende vordefinierte Demo-Anmeldedaten
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demopassword'
      });
      
      if (error) throw error;
      
      // Erfolgreich eingeloggt, zur Projektliste navigieren
      navigate('/projects');
    } catch (error) {
      console.error('Demo login error:', error);
      
      // Erstelle einen Demo-Benutzer, falls keiner existiert
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'demo@example.com',
          password: 'demopassword',
          options: {
            data: {
              name: 'Demo User',
              company_name: 'Demo GmbH'
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Versuche erneut einzuloggen
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'demo@example.com',
          password: 'demopassword'
        });
        
        if (error) throw error;
        
        navigate('/projects');
      } catch (finalError) {
        setError('Demo-Login fehlgeschlagen. Bitte registrieren Sie sich oder versuchen Sie es später erneut.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">MS</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Passwort zurücksetzen</h1>
              <p className="text-gray-600 mt-1">
                {resetSent ? 'Wir haben Ihnen eine E-Mail zum Zurücksetzen gesendet' : 'Geben Sie Ihre E-Mail-Adresse ein'}
              </p>
            </div>

            {resetSent ? (
              <div className="text-center">
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-green-700">
                    Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Zurück zum Login
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 flex items-center"
                  >
                    <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail-Adresse
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SafeIcon icon={FiMail} className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="resetEmail"
                        name="resetEmail"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ihre.email@beispiel.de"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : null}
                      Senden
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">MS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Anmelden</h1>
            <p className="text-gray-600 mt-1">Melden Sie sich an, um auf Ihre Projekte zuzugreifen</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 flex items-start"
            >
              <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <span>{error}</span>
                {error.includes('Ungültige Anmeldedaten') && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowResetPassword(true)}
                      className="text-sm underline hover:no-underline"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiMail} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ihre.email@beispiel.de"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiLock} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Angemeldet bleiben
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Passwort vergessen?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <SafeIcon icon={FiLogIn} className="w-4 h-4 mr-2" />
              )}
              Anmelden
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Noch kein Konto?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Jetzt registrieren
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Probleme beim Anmelden?</strong><br />
              Versuchen Sie, sich mit einer neuen E-Mail-Adresse zu registrieren oder nutzen Sie unsere Demo-Option.
            </p>
            <button 
              onClick={handleDemoLogin}
              className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              {loading ? "Wird geladen..." : "Demo-Login verwenden"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;