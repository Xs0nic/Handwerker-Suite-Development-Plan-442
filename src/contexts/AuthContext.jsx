import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Vordefinierte Rollen mit ihren Berechtigungen
const ROLES = {
  ADMINISTRATOR: {
    id: 'administrator',
    name: 'Administrator',
    description: 'Vollzugriff auf alle Funktionen und Einstellungen',
    isSystem: true,
    permissions: {
      projects: { view: true, create: true, edit: true, delete: true },
      measurements: { view: true, create: true, edit: true, delete: true },
      calculations: { view: true, create: true, edit: true },
      plans: { view: true, create: true, edit: true, delete: true },
      chat: { view: true, send: true },
      settings: { view: true, edit: true },
      users: { view: true, invite: true, edit: true, delete: true },
      company: { view: true, edit: true },
      roles: { view: true, create: true, edit: true, delete: true },
      files: { view: true, create: true, edit: true, delete: true }
    }
  },
  FOREMAN: {
    id: 'foreman',
    name: 'Vorarbeiter',
    description: 'Kann Projekte verwalten und Mitarbeiter koordinieren',
    isSystem: true,
    permissions: {
      projects: { view: true, create: true, edit: true, delete: false },
      measurements: { view: true, create: true, edit: true, delete: true },
      calculations: { view: true, create: true, edit: true },
      plans: { view: true, create: true, edit: true, delete: false },
      chat: { view: true, send: true },
      settings: { view: false, edit: false },
      users: { view: false, invite: false, edit: false, delete: false },
      company: { view: false, edit: false },
      roles: { view: false, create: false, edit: false, delete: false },
      files: { view: true, create: true, edit: true, delete: false }
    }
  },
  EMPLOYEE: {
    id: 'employee',
    name: 'Mitarbeiter',
    description: 'Kann Projekte einsehen und an Aufgaben arbeiten',
    isSystem: true,
    permissions: {
      projects: { view: true, create: false, edit: false, delete: false },
      measurements: { view: true, create: false, edit: false, delete: false },
      calculations: { view: false, create: false, edit: false },
      plans: { view: true, create: false, edit: false, delete: false },
      chat: { view: true, send: true },
      settings: { view: false, edit: false },
      users: { view: false, invite: false, edit: false, delete: false },
      company: { view: false, edit: false },
      roles: { view: false, create: false, edit: false, delete: false },
      files: { view: true, create: true, edit: false, delete: false }
    }
  }
};

// Lizenz-Pakete
const SUBSCRIPTION_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Einsteiger-Paket',
    maxUsers: 2,
    price: '19,90€',
    period: 'monatlich'
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Profi-Paket',
    maxUsers: 5,
    price: '49,90€',
    period: 'monatlich'
  },
  BUSINESS: {
    id: 'business',
    name: 'Business-Paket',
    maxUsers: 15,
    price: '99,90€',
    period: 'monatlich'
  },
  TRIAL: {
    id: 'trial',
    name: 'Demo-Version',
    maxUsers: 10,
    price: 'Kostenlos',
    period: 'unbegrenzt'
  }
};

// Verfügbare Berechtigungsmodule
const PERMISSION_MODULES = [
  { id: 'projects', name: 'Projekte', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'measurements', name: 'Aufmaß', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'calculations', name: 'Kalkulation', actions: ['view', 'create', 'edit'] },
  { id: 'plans', name: 'Projektplanung', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'chat', name: 'Team-Chat', actions: ['view', 'send'] },
  { id: 'settings', name: 'Einstellungen', actions: ['view', 'edit'] },
  { id: 'users', name: 'Nutzerverwaltung', actions: ['view', 'invite', 'edit', 'delete'] },
  { id: 'company', name: 'Firmeneinstellungen', actions: ['view', 'edit'] },
  { id: 'roles', name: 'Rollenverwaltung', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'files', name: 'Dateiablage', actions: ['view', 'create', 'edit', 'delete'] }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Beim App-Start die Session prüfen
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        
        // Aktuelle Session abrufen
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          setLoading(false);
          return;
        }

        if (currentSession) {
          console.log('Session found:', currentSession);
          setSession(currentSession);
          await setupUserData(currentSession);
        }
      } catch (error) {
        console.error('Session fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Auth-State-Änderungen überwachen
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession);
      
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        await setupUserData(newSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentUser(null);
        setCurrentCompany(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const setupUserData = async (session) => {
    try {
      const user = session.user;
      console.log('Setting up user data for:', user);
      
      // Demo-Modus: Erstelle Benutzerdaten basierend auf user_metadata
      const userData = user.user_metadata || {};
      console.log('User metadata:', userData);
      
      const dummyUser = {
        id: user.id,
        name: userData.name || user.email.split('@')[0] || 'Demo User',
        email: user.email,
        role: ROLES.ADMINISTRATOR,
        last_login: new Date().toISOString()
      };

      const dummyCompany = {
        id: 'demo-company',
        name: userData.company_name || 'Demo GmbH',
        subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
        subscription_plan_id: 'trial',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null // Unbegrenzt für Demo
      };

      setCurrentUser(dummyUser);
      setCurrentCompany(dummyCompany);
      
      console.log('User data setup complete:', { user: dummyUser, company: dummyCompany });
    } catch (error) {
      console.error('Error setting up user data:', error);
      
      // Fallback für Demo-Modus
      const dummyUser = {
        id: session.user.id,
        name: session.user.email.split('@')[0] || 'Demo User',
        email: session.user.email,
        role: ROLES.ADMINISTRATOR,
        last_login: new Date().toISOString()
      };

      const dummyCompany = {
        id: 'demo-company',
        name: 'Demo GmbH',
        subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
        subscription_plan_id: 'trial',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null
      };

      setCurrentUser(dummyUser);
      setCurrentCompany(dummyCompany);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Logging in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error in auth context:', error);
        throw error;
      }

      console.log('Login successful in auth context:', data);
      return data;
    } catch (error) {
      console.error('Login error in auth context catch:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Lokale Daten löschen
      setCurrentUser(null);
      setCurrentCompany(null);
      setSession(null);
      localStorage.removeItem('meister-chat-user');

      // Zur Login-Seite weiterleiten
      window.location.hash = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Passwort zurücksetzen
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Neues Passwort setzen
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  };

  // Benutzerprofil aktualisieren
  const updateUserProfile = async (name, currentPassword, newPassword = null) => {
    if (!currentUser) {
      throw new Error('Kein Benutzer angemeldet');
    }

    try {
      // Update user metadata
      const updates = {
        data: { name }
      };

      if (newPassword) {
        updates.password = newPassword;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      // Update local state
      setCurrentUser(prev => ({ ...prev, name }));

      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Firmendaten aktualisieren
  const updateCompanyDetails = async (updates) => {
    if (!currentCompany) {
      throw new Error('Keine Firma ausgewählt');
    }

    try {
      // Im Demo-Modus: Einfach das lokale Firmenobjekt aktualisieren
      setCurrentCompany(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('Company update error:', error);
      throw error;
    }
  };

  // Abonnement ändern
  const changeSubscriptionPlan = async (planId) => {
    try {
      const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      if (!plan) throw new Error('Ungültiges Abonnement');

      // Im Demo-Modus: Einfach das lokale Firmenobjekt aktualisieren
      setCurrentCompany(prev => ({
        ...prev,
        subscription_plan_id: planId,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: planId === 'trial' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionPlan: plan
      }));

      return true;
    } catch (error) {
      console.error('Subscription change error:', error);
      throw error;
    }
  };

  // Demo-Funktionen für Benutzerverwaltung
  const inviteUser = async (email, roleId) => {
    return {
      id: `inv-${Date.now()}`,
      email,
      role_id: roleId,
      company_id: currentCompany.id,
      invited_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  };

  const acceptInvitation = async (token, name, password) => {
    return {
      user: {
        id: `user-${Date.now()}`,
        name,
        email: `demo-${Date.now()}@example.com`
      }
    };
  };

  const removeUser = async (userId) => {
    return true;
  };

  const changeUserRole = async (userId, roleId) => {
    return true;
  };

  const revokeInvitation = async (invitationId) => {
    return true;
  };

  // Berechtigungsprüfung
  const hasPermission = (module, action) => {
    if (!currentUser) return false;
    return currentUser.role.permissions[module]?.[action] || false;
  };

  // Verfügbare Rollen abrufen
  const getAvailableRoles = () => {
    return Object.values(ROLES);
  };

  // Berechtigungsmodule abrufen
  const getPermissionModules = () => {
    return PERMISSION_MODULES;
  };

  // Abonnements abrufen
  const getSubscriptionPlans = () => {
    return Object.values(SUBSCRIPTION_PLANS);
  };

  // Demo-Firmenmitglieder abrufen
  const getCompanyUsers = () => {
    return [
      {
        id: 'user-1',
        name: currentUser?.name || 'Demo User',
        email: currentUser?.email || 'demo@example.com',
        role: ROLES.ADMINISTRATOR,
        last_login: new Date().toISOString()
      },
      {
        id: 'user-2',
        name: 'Anna Schmidt',
        email: 'anna@example.com',
        role: ROLES.FOREMAN,
        last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user-3',
        name: 'Max Mustermann',
        email: 'max@example.com',
        role: ROLES.EMPLOYEE,
        last_login: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  // Demo-Einladungen abrufen
  const getCompanyInvitations = () => {
    return [
      {
        id: 'inv-1',
        email: 'einladung@example.com',
        company_id: currentCompany?.id || 'demo-company',
        role: ROLES.EMPLOYEE,
        token: 'demo-token-123',
        invited_by: currentUser?.id || 'user-1',
        invited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        accepted: false
      }
    ];
  };

  // RequireAuth Komponente
  const RequireAuth = ({ children, permissions = null }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/login" replace />;
    }

    // Wenn Berechtigungen angegeben sind, diese prüfen
    if (permissions && !hasPermission(permissions.module, permissions.action)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children;
  };

  const value = {
    currentUser,
    currentCompany,
    session,
    loading,
    login,
    logout,
    resetPassword,
    updatePassword,
    updateUserProfile,
    updateCompanyDetails,
    changeSubscriptionPlan,
    inviteUser,
    acceptInvitation,
    removeUser,
    changeUserRole,
    revokeInvitation,
    hasPermission,
    getAvailableRoles,
    getPermissionModules,
    getSubscriptionPlans,
    getCompanyUsers,
    getCompanyInvitations,
    RequireAuth,
    ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};