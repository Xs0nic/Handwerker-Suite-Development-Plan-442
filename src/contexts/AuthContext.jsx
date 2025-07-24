import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

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
    permissions: {
      projects: { view: true, create: true, edit: true, delete: true },
      measurements: { view: true, create: true, edit: true, delete: true },
      calculations: { view: true, create: true, edit: true },
      plans: { view: true, create: true, edit: true, delete: true },
      chat: { view: true, send: true },
      settings: { view: true, edit: true },
      users: { view: true, invite: true, edit: true, delete: true },
      company: { view: true, edit: true }
    }
  },
  FOREMAN: {
    id: 'foreman',
    name: 'Vorarbeiter',
    permissions: {
      projects: { view: true, create: true, edit: true, delete: false },
      measurements: { view: true, create: true, edit: true, delete: true },
      calculations: { view: true, create: true, edit: true },
      plans: { view: true, create: true, edit: true, delete: false },
      chat: { view: true, send: true },
      settings: { view: false, edit: false },
      users: { view: false, invite: false, edit: false, delete: false },
      company: { view: false, edit: false }
    }
  },
  EMPLOYEE: {
    id: 'employee',
    name: 'Mitarbeiter',
    permissions: {
      projects: { view: true, create: false, edit: false, delete: false },
      measurements: { view: true, create: false, edit: false, delete: false },
      calculations: { view: false, create: false, edit: false },
      plans: { view: true, create: false, edit: false, delete: false },
      chat: { view: true, send: true },
      settings: { view: false, edit: false },
      users: { view: false, invite: false, edit: false, delete: false },
      company: { view: false, edit: false }
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
    name: '30-Tage-Testversion',
    maxUsers: 3,
    price: 'Kostenlos',
    period: '30 Tage'
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [invitations, setInvitations] = useState([]);

  // Beim Start der App: Prüfe, ob ein Nutzer eingeloggt ist
  useEffect(() => {
    // Lade gespeicherte Auth-Daten aus dem localStorage
    const savedUser = localStorage.getItem('meister-auth-user');
    const savedCompany = localStorage.getItem('meister-auth-company');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    if (savedCompany) {
      setCurrentCompany(JSON.parse(savedCompany));
    }

    // Lade alle Nutzer und Firmen
    const savedAllUsers = localStorage.getItem('meister-all-users');
    const savedAllCompanies = localStorage.getItem('meister-all-companies');
    const savedInvitations = localStorage.getItem('meister-invitations');
    
    if (savedAllUsers) setAllUsers(JSON.parse(savedAllUsers));
    if (savedAllCompanies) setAllCompanies(JSON.parse(savedAllCompanies));
    if (savedInvitations) setInvitations(JSON.parse(savedInvitations));
    
    setLoading(false);
  }, []);

  // Speichere Änderungen an Nutzern und Firmen
  useEffect(() => {
    if (allUsers.length > 0) {
      localStorage.setItem('meister-all-users', JSON.stringify(allUsers));
    }
  }, [allUsers]);

  useEffect(() => {
    if (allCompanies.length > 0) {
      localStorage.setItem('meister-all-companies', JSON.stringify(allCompanies));
    }
  }, [allCompanies]);

  useEffect(() => {
    if (invitations.length > 0) {
      localStorage.setItem('meister-invitations', JSON.stringify(invitations));
    }
  }, [invitations]);

  // Speichere den aktuellen Nutzer und Firma im localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('meister-auth-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('meister-auth-user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentCompany) {
      localStorage.setItem('meister-auth-company', JSON.stringify(currentCompany));
    } else {
      localStorage.removeItem('meister-auth-company');
    }
  }, [currentCompany]);

  // Registrierung eines neuen Nutzers + Firma
  const register = (email, password, name, companyName) => {
    // Prüfe, ob die E-Mail bereits existiert
    const existingUser = allUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('Ein Benutzer mit dieser E-Mail existiert bereits.');
    }

    // Erstelle eine neue Firma
    const newCompany = {
      id: Date.now().toString(),
      name: companyName,
      createdAt: new Date().toISOString(),
      subscriptionPlan: SUBSCRIPTION_PLANS.TRIAL,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 Tage ab jetzt
    };

    // Erstelle einen neuen Nutzer als Administrator
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In einer echten App: Passwort hashen!
      companyId: newCompany.id,
      role: ROLES.ADMINISTRATOR,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Speichere die neue Firma und den neuen Nutzer
    setAllCompanies(prev => [...prev, newCompany]);
    setAllUsers(prev => [...prev, newUser]);

    // Setze den aktuellen Nutzer und die aktuelle Firma
    setCurrentUser(newUser);
    setCurrentCompany(newCompany);

    return { user: newUser, company: newCompany };
  };

  // Login eines existierenden Nutzers
  const login = (email, password) => {
    // Finde den Nutzer anhand der E-Mail
    const user = allUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    
    // Prüfe, ob der Nutzer existiert und das Passwort korrekt ist
    if (!user || user.password !== password) { // In einer echten App: Passwort-Vergleich mit Hash
      throw new Error('Ungültige E-Mail oder Passwort');
    }

    // Finde die Firma des Nutzers
    const company = allCompanies.find(company => company.id === user.companyId);
    if (!company) {
      throw new Error('Firma nicht gefunden');
    }

    // Aktualisiere den letzten Login-Zeitpunkt
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString()
    };

    // Aktualisiere den Nutzer in der Liste aller Nutzer
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    // Setze den aktuellen Nutzer und die aktuelle Firma
    setCurrentUser(updatedUser);
    setCurrentCompany(company);

    return { user: updatedUser, company };
  };

  // Logout des aktuellen Nutzers
  const logout = () => {
    setCurrentUser(null);
    setCurrentCompany(null);
  };

  // Einladung eines neuen Nutzers zur Firma
  const inviteUser = (email, role) => {
    if (!currentUser || !currentCompany) {
      throw new Error('Sie müssen angemeldet sein, um Einladungen zu versenden.');
    }

    // Prüfe, ob der aktuelle Nutzer Administrator ist
    if (currentUser.role.id !== ROLES.ADMINISTRATOR.id) {
      throw new Error('Nur Administratoren können Einladungen versenden.');
    }

    // Prüfe, ob die maximale Anzahl an Nutzern erreicht ist
    const companyUsers = allUsers.filter(user => user.companyId === currentCompany.id);
    const pendingInvitations = invitations.filter(inv => inv.companyId === currentCompany.id && !inv.accepted);

    if (companyUsers.length + pendingInvitations.length >= currentCompany.subscriptionPlan.maxUsers) {
      throw new Error(`Ihr aktuelles Paket ist auf ${currentCompany.subscriptionPlan.maxUsers} Nutzer beschränkt. Bitte führen Sie ein Upgrade durch, um weitere Mitarbeiter hinzuzufügen.`);
    }

    // Prüfe, ob die E-Mail bereits eingeladen wurde oder bereits Nutzer ist
    const existingInvitation = invitations.find(
      inv => inv.email.toLowerCase() === email.toLowerCase() && 
             inv.companyId === currentCompany.id &&
             !inv.accepted
    );
    
    if (existingInvitation) {
      throw new Error('Diese E-Mail wurde bereits eingeladen.');
    }

    const existingUser = allUsers.find(
      user => user.email.toLowerCase() === email.toLowerCase() && 
              user.companyId === currentCompany.id
    );
    
    if (existingUser) {
      throw new Error('Ein Nutzer mit dieser E-Mail existiert bereits in Ihrer Firma.');
    }

    // Erstelle eine neue Einladung
    const newInvitation = {
      id: Date.now().toString(),
      email,
      companyId: currentCompany.id,
      companyName: currentCompany.name,
      role: role === 'foreman' ? ROLES.FOREMAN : ROLES.EMPLOYEE,
      invitedBy: currentUser.id,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 Tage ab jetzt
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      accepted: false
    };

    // Speichere die neue Einladung
    setInvitations(prev => [...prev, newInvitation]);

    return newInvitation;
  };

  // Akzeptieren einer Einladung
  const acceptInvitation = (token, name, password) => {
    // Finde die Einladung anhand des Tokens
    const invitation = invitations.find(inv => inv.token === token && !inv.accepted);
    
    if (!invitation) {
      throw new Error('Ungültige oder abgelaufene Einladung');
    }

    // Prüfe, ob die Einladung abgelaufen ist
    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error('Diese Einladung ist abgelaufen');
    }

    // Prüfe, ob die E-Mail bereits als Nutzer registriert ist
    const existingUser = allUsers.find(user => user.email.toLowerCase() === invitation.email.toLowerCase());
    if (existingUser) {
      throw new Error('Ein Benutzer mit dieser E-Mail existiert bereits');
    }

    // Finde die Firma
    const company = allCompanies.find(company => company.id === invitation.companyId);
    if (!company) {
      throw new Error('Firma nicht gefunden');
    }

    // Erstelle einen neuen Nutzer
    const newUser = {
      id: Date.now().toString(),
      name,
      email: invitation.email,
      password, // In einer echten App: Passwort hashen!
      companyId: invitation.companyId,
      role: invitation.role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Aktualisiere die Einladung als akzeptiert
    const updatedInvitation = {
      ...invitation,
      accepted: true,
      acceptedAt: new Date().toISOString()
    };

    // Speichere den neuen Nutzer und aktualisiere die Einladung
    setAllUsers(prev => [...prev, newUser]);
    setInvitations(prev => prev.map(inv => inv.id === invitation.id ? updatedInvitation : inv));

    // Setze den aktuellen Nutzer und die aktuelle Firma
    setCurrentUser(newUser);
    setCurrentCompany(company);

    return { user: newUser, company };
  };

  // Ändern der Rolle eines Nutzers
  const changeUserRole = (userId, newRoleId) => {
    if (!currentUser || !currentCompany) {
      throw new Error('Sie müssen angemeldet sein, um Nutzerrollen zu ändern.');
    }

    // Prüfe, ob der aktuelle Nutzer Administrator ist
    if (currentUser.role.id !== ROLES.ADMINISTRATOR.id) {
      throw new Error('Nur Administratoren können Nutzerrollen ändern.');
    }

    // Finde den Nutzer
    const user = allUsers.find(user => user.id === userId && user.companyId === currentCompany.id);
    if (!user) {
      throw new Error('Nutzer nicht gefunden');
    }

    // Verhindere, dass der letzte Administrator entfernt wird
    if (user.role.id === ROLES.ADMINISTRATOR.id) {
      const adminCount = allUsers.filter(u => 
        u.companyId === currentCompany.id && 
        u.role.id === ROLES.ADMINISTRATOR.id
      ).length;
      
      if (adminCount === 1 && newRoleId !== ROLES.ADMINISTRATOR.id) {
        throw new Error('Es muss mindestens ein Administrator pro Firma geben');
      }
    }

    // Bestimme die neue Rolle
    let newRole;
    switch (newRoleId) {
      case 'administrator':
        newRole = ROLES.ADMINISTRATOR;
        break;
      case 'foreman':
        newRole = ROLES.FOREMAN;
        break;
      case 'employee':
        newRole = ROLES.EMPLOYEE;
        break;
      default:
        throw new Error('Ungültige Rolle');
    }

    // Aktualisiere den Nutzer
    const updatedUser = {
      ...user,
      role: newRole
    };

    // Speichere den aktualisierten Nutzer
    setAllUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));

    return updatedUser;
  };

  // Nutzer aus der Firma entfernen
  const removeUser = (userId) => {
    if (!currentUser || !currentCompany) {
      throw new Error('Sie müssen angemeldet sein, um Nutzer zu entfernen.');
    }

    // Prüfe, ob der aktuelle Nutzer Administrator ist
    if (currentUser.role.id !== ROLES.ADMINISTRATOR.id) {
      throw new Error('Nur Administratoren können Nutzer entfernen.');
    }

    // Finde den Nutzer
    const user = allUsers.find(user => user.id === userId && user.companyId === currentCompany.id);
    if (!user) {
      throw new Error('Nutzer nicht gefunden');
    }

    // Verhindere, dass der letzte Administrator entfernt wird
    if (user.role.id === ROLES.ADMINISTRATOR.id) {
      const adminCount = allUsers.filter(u => 
        u.companyId === currentCompany.id && 
        u.role.id === ROLES.ADMINISTRATOR.id
      ).length;
      
      if (adminCount === 1) {
        throw new Error('Der letzte Administrator kann nicht entfernt werden');
      }
    }

    // Verhindere, dass ein Nutzer sich selbst entfernt
    if (user.id === currentUser.id) {
      throw new Error('Sie können sich nicht selbst entfernen');
    }

    // Entferne den Nutzer
    setAllUsers(prev => prev.filter(u => u.id !== userId));

    return true;
  };

  // Einladung zurückziehen
  const revokeInvitation = (invitationId) => {
    if (!currentUser || !currentCompany) {
      throw new Error('Sie müssen angemeldet sein, um Einladungen zurückzuziehen.');
    }

    // Prüfe, ob der aktuelle Nutzer Administrator ist
    if (currentUser.role.id !== ROLES.ADMINISTRATOR.id) {
      throw new Error('Nur Administratoren können Einladungen zurückziehen.');
    }

    // Finde die Einladung
    const invitation = invitations.find(
      inv => inv.id === invitationId && 
             inv.companyId === currentCompany.id &&
             !inv.accepted
    );
    
    if (!invitation) {
      throw new Error('Einladung nicht gefunden');
    }

    // Entferne die Einladung
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

    return true;
  };

  // Firmen-Abonnement ändern
  const changeSubscriptionPlan = (planId) => {
    if (!currentUser || !currentCompany) {
      throw new Error('Sie müssen angemeldet sein, um das Abonnement zu ändern.');
    }

    // Prüfe, ob der aktuelle Nutzer Administrator ist
    if (currentUser.role.id !== ROLES.ADMINISTRATOR.id) {
      throw new Error('Nur Administratoren können das Abonnement ändern.');
    }

    // Bestimme den neuen Plan
    let newPlan;
    switch (planId) {
      case 'starter':
        newPlan = SUBSCRIPTION_PLANS.STARTER;
        break;
      case 'professional':
        newPlan = SUBSCRIPTION_PLANS.PROFESSIONAL;
        break;
      case 'business':
        newPlan = SUBSCRIPTION_PLANS.BUSINESS;
        break;
      case 'trial':
        newPlan = SUBSCRIPTION_PLANS.TRIAL;
        break;
      default:
        throw new Error('Ungültiger Plan');
    }

    // Prüfe, ob der neue Plan genug Lizenzen für die aktuellen Nutzer hat
    const companyUsers = allUsers.filter(user => user.companyId === currentCompany.id);
    const pendingInvitations = invitations.filter(inv => inv.companyId === currentCompany.id && !inv.accepted);

    if (companyUsers.length + pendingInvitations.length > newPlan.maxUsers) {
      throw new Error(`Sie haben bereits ${companyUsers.length} Nutzer und ${pendingInvitations.length} ausstehende Einladungen. Der ausgewählte Plan erlaubt nur ${newPlan.maxUsers} Nutzer. Bitte wählen Sie einen größeren Plan oder entfernen Sie Nutzer.`);
    }

    // Aktualisiere die Firma
    const updatedCompany = {
      ...currentCompany,
      subscriptionPlan: newPlan,
      // Wenn es sich um ein Upgrade handelt, behalten wir das aktuelle Enddatum bei
      // Bei einem Downgrade oder einer Testversion setzen wir ein neues Enddatum
      subscriptionEndDate: newPlan.id === 'trial' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : currentCompany.subscriptionEndDate
    };

    // Speichere die aktualisierte Firma
    setAllCompanies(prev => prev.map(c => c.id === currentCompany.id ? updatedCompany : c));
    setCurrentCompany(updatedCompany);

    return updatedCompany;
  };

  // Firmendetails aktualisieren
  const updateCompanyDetails = (name) => {
    if (!currentUser || !currentCompany) {
      throw new Error('Sie müssen angemeldet sein, um Firmendetails zu aktualisieren.');
    }

    // Prüfe, ob der aktuelle Nutzer Administrator ist
    if (currentUser.role.id !== ROLES.ADMINISTRATOR.id) {
      throw new Error('Nur Administratoren können Firmendetails aktualisieren.');
    }

    // Aktualisiere die Firma
    const updatedCompany = {
      ...currentCompany,
      name
    };

    // Speichere die aktualisierte Firma
    setAllCompanies(prev => prev.map(c => c.id === currentCompany.id ? updatedCompany : c));
    setCurrentCompany(updatedCompany);

    return updatedCompany;
  };

  // Nutzerdetails aktualisieren
  const updateUserProfile = (name, currentPassword, newPassword = null) => {
    if (!currentUser) {
      throw new Error('Sie müssen angemeldet sein, um Ihr Profil zu aktualisieren.');
    }

    // Prüfe, ob das aktuelle Passwort korrekt ist
    if (currentUser.password !== currentPassword) { // In einer echten App: Passwort-Vergleich mit Hash
      throw new Error('Das aktuelle Passwort ist nicht korrekt');
    }

    // Aktualisiere den Nutzer
    const updatedUser = {
      ...currentUser,
      name,
      password: newPassword || currentUser.password // Nur ändern, wenn ein neues Passwort angegeben wurde
    };

    // Speichere den aktualisierten Nutzer
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    return updatedUser;
  };

  // Prüfe, ob der aktuelle Nutzer eine bestimmte Berechtigung hat
  const hasPermission = (module, action) => {
    if (!currentUser) return false;
    return currentUser.role.permissions[module]?.[action] || false;
  };

  // Hole alle Nutzer der aktuellen Firma
  const getCompanyUsers = () => {
    if (!currentUser || !currentCompany) return [];
    return allUsers.filter(user => user.companyId === currentCompany.id);
  };

  // Hole alle ausstehenden Einladungen der aktuellen Firma
  const getCompanyInvitations = () => {
    if (!currentUser || !currentCompany) return [];
    return invitations.filter(inv => inv.companyId === currentCompany.id && !inv.accepted);
  };

  // Hole alle verfügbaren Abonnement-Pakete
  const getSubscriptionPlans = () => {
    return Object.values(SUBSCRIPTION_PLANS);
  };

  // Hole alle verfügbaren Rollen
  const getAvailableRoles = () => {
    return [ROLES.ADMINISTRATOR, ROLES.FOREMAN, ROLES.EMPLOYEE];
  };

  // RequireAuth-Komponente, die prüft, ob ein Nutzer angemeldet ist
  const RequireAuth = ({ children, permissions = null }) => {
    if (loading) {
      return <div>Wird geladen...</div>;
    }

    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    // Wenn spezifische Berechtigungen erforderlich sind, prüfe diese
    if (permissions) {
      const { module, action } = permissions;
      if (!hasPermission(module, action)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    return children;
  };

  const value = {
    currentUser,
    currentCompany,
    loading,
    register,
    login,
    logout,
    inviteUser,
    acceptInvitation,
    changeUserRole,
    removeUser,
    revokeInvitation,
    changeSubscriptionPlan,
    updateCompanyDetails,
    updateUserProfile,
    hasPermission,
    getCompanyUsers,
    getCompanyInvitations,
    getSubscriptionPlans,
    getAvailableRoles,
    RequireAuth,
    ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};