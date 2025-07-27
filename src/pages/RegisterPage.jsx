import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import supabase from '../lib/supabase';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLock, FiMail, FiBriefcase, FiUserPlus, FiAlertCircle, FiCheckCircle } = FiIcons;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    companyName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Bitte geben Sie Ihren Namen ein.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return false;
    }
    if (!formData.password) {
      setError('Bitte geben Sie ein Passwort ein.');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName.trim()) {
      setError('Bitte geben Sie einen Firmennamen ein.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      handleNextStep();
      return;
    }
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('Starting registration process...');
      
      // Registrierung mit E-Mail-Bestätigung deaktiviert für Demo
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            company_name: formData.companyName
          },
          // E-Mail-Bestätigung für Demo deaktivieren
          emailRedirectTo: undefined
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Spezifische Fehlermeldungen
        if (authError.message?.includes('User already registered')) {
          setError('Diese E-Mail-Adresse ist bereits registriert. Bitte verwenden Sie eine andere oder melden Sie sich an.');
        } else if (authError.message?.includes('Invalid email')) {
          setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        } else if (authError.message?.includes('Password should be at least')) {
          setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
        } else {
          setError('Bei der Registrierung ist ein Fehler aufgetreten: ' + authError.message);
        }
        setLoading(false);
        return;
      }

      console.log('Registration successful:', authData);

      // Für Demo-Zwecke: Direkt zur Projektliste weiterleiten ohne E-Mail-Bestätigung
      if (authData.user && authData.session) {
        console.log('User registered and logged in immediately');
        
        // Für Demo-Zwecke: Direkt einloggen mit den gerade eingegebenen Daten
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (signInError) {
          console.error('Auto-login error:', signInError);
          setError('Registrierung erfolgreich, aber automatischer Login fehlgeschlagen. Bitte melden Sie sich manuell an.');
          setRegistrationComplete(true);
          setNeedsEmailConfirmation(false);
          setLoading(false);
          return;
        }
        
        setTimeout(() => {
          navigate('/projects');
        }, 2000);
        setRegistrationComplete(true);
        setNeedsEmailConfirmation(false);
      } else {
        // Falls doch E-Mail-Bestätigung erforderlich
        console.log('Email confirmation required');
        setRegistrationComplete(true);
        setNeedsEmailConfirmation(true);
      }

    } catch (error) {
      console.error('Registration error:', error);
      setError('Bei der Registrierung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100">
              <SafeIcon icon={FiCheckCircle} className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {needsEmailConfirmation ? 'Registrierung erfolgreich!' : 'Willkommen!'}
            </h2>
            <p className="text-gray-600">
              {needsEmailConfirmation ? (
                <>
                  Wir haben Ihnen eine Bestätigungs-E-Mail an <strong>{formData.email}</strong> gesendet.
                </>
              ) : (
                <>
                  Ihre Registrierung war erfolgreich. Sie werden automatisch weitergeleitet.
                </>
              )}
            </p>
          </div>

          {needsEmailConfirmation ? (
            <>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <SafeIcon icon={FiMail} className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Nächste Schritte:</p>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Prüfen Sie Ihr E-Mail-Postfach</li>
                      <li>2. Klicken Sie auf den Bestätigungslink</li>
                      <li>3. Loggen Sie sich ein und legen Sie los!</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-700">
                  <strong>Hinweis:</strong> Der Bestätigungslink ist 24 Stunden gültig. Prüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-700">
                🎉 Ihre Registrierung ist abgeschlossen! Sie können sofort mit der Nutzung beginnen.
              </p>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {needsEmailConfirmation ? 'Zum Login' : 'Weiter zur Anwendung'}
            </Link>
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
            <h1 className="text-2xl font-bold text-gray-900">Registrieren</h1>
            <p className="text-gray-600 mt-1">Erstellen Sie ein Konto für Ihr Unternehmen</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex-1 border-t-2 ${step >= 1 ? 'border-blue-500' : 'border-gray-200'}`}></div>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`flex-1 border-t-2 ${step >= 2 ? 'border-blue-500' : 'border-gray-200'}`}></div>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className="flex-1 border-t-2 border-gray-200"></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium text-gray-500">Persönliche Daten</span>
              <span className="text-xs font-medium text-gray-500">Unternehmen</span>
            </div>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiUser} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Max Mustermann"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse *
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
                    Passwort *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiLock} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mindestens 8 Zeichen"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Das Passwort muss mindestens 8 Zeichen lang sein.
                  </p>
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort bestätigen *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiLock} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Passwort wiederholen"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Firmenname *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiBriefcase} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      autoComplete="organization"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mustermann GmbH"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo-Version</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    In der Demo-Version ist die E-Mail-Bestätigung deaktiviert. Sie können sich sofort anmelden:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Sofortiger Zugang zu allen Funktionen</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Keine E-Mail-Bestätigung erforderlich</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Vollständige Demo-Funktionalität</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            <div className="flex space-x-3 pt-4">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Zurück
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <SafeIcon icon={step === 1 ? FiUser : FiUserPlus} className="w-4 h-4 mr-2" />
                )}
                {step === 1 ? 'Weiter' : (loading ? 'Registrierung läuft...' : 'Registrieren')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Bereits registriert?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;