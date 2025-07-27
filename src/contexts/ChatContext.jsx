import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState({});
  const [globalMessages, setGlobalMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const { currentUser: authUser } = useAuth();

  useEffect(() => {
    if (authUser) {
      // Automatically use the logged-in user's name
      setCurrentUser(authUser.name);
    }

    // Load demo messages
    const demoMessages = {
      'project-1': [
        {
          id: 'msg-1',
          text: 'Hallo Team, die Fliesen werden morgen geliefert.',
          sender: 'Max Mustermann',
          timestamp: '2023-06-18T10:30:00.000Z',
          edited: false
        },
        {
          id: 'msg-2',
          text: 'Super, dann können wir am Mittwoch mit dem Verlegen beginnen.',
          sender: 'Anna Schmidt',
          timestamp: '2023-06-18T10:35:00.000Z',
          edited: false
        },
        {
          id: 'msg-3',
          text: 'Bitte denkt daran, auch den Fliesenkleber mitzubringen.',
          sender: 'Demo User',
          timestamp: '2023-06-18T10:40:00.000Z',
          edited: false
        }
      ]
    };
    setMessages(demoMessages);

    // Load demo global messages
    const demoGlobalMessages = [
      {
        id: 'global-1',
        text: 'Willkommen im Firmen-Chat! Hier können alle Mitarbeiter unabhängig von Projekten miteinander kommunizieren.',
        sender: 'System',
        timestamp: '2023-06-15T09:00:00.000Z',
        edited: false
      },
      {
        id: 'global-2',
        text: 'Hallo zusammen! Hat jemand Erfahrung mit dem neuen Fliesenkleber von Knauf?',
        sender: 'Max Mustermann',
        timestamp: '2023-06-15T09:30:00.000Z',
        edited: false
      },
      {
        id: 'global-3',
        text: 'Ja, wir haben ihn letzte Woche bei Familie Müller verwendet. Sehr gute Haftung, aber etwas längere Trocknungszeit als angegeben.',
        sender: 'Anna Schmidt',
        timestamp: '2023-06-15T09:35:00.000Z',
        edited: false
      }
    ];
    setGlobalMessages(demoGlobalMessages);
  }, [authUser]);

  const sendMessage = (projectId, messageData) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      text: messageData.text,
      sender: messageData.sender,
      timestamp: messageData.timestamp || new Date().toISOString(),
      edited: false
    };

    setMessages(prev => ({
      ...prev,
      [projectId]: [
        ...(prev[projectId] || []),
        newMessage
      ]
    }));

    return newMessage;
  };

  const editMessage = (projectId, messageId, newText) => {
    setMessages(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).map(msg =>
        msg.id === messageId
          ? { ...msg, text: newText, edited: true, editedAt: new Date().toISOString() }
          : msg
      )
    }));
  };

  const deleteMessage = (projectId, messageId) => {
    setMessages(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(msg => msg.id !== messageId)
    }));
  };

  // Global chat methods
  const sendGlobalMessage = (messageData) => {
    const newMessage = {
      id: `global-${Date.now()}`,
      text: messageData.text,
      sender: messageData.sender,
      timestamp: messageData.timestamp || new Date().toISOString(),
      edited: false
    };

    setGlobalMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const editGlobalMessage = (messageId, newText) => {
    setGlobalMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, text: newText, edited: true, editedAt: new Date().toISOString() }
          : msg
      )
    );
  };

  const deleteGlobalMessage = (messageId) => {
    setGlobalMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const getGlobalMessages = () => {
    return globalMessages;
  };

  const getProjectMessages = (projectId) => {
    return messages[projectId] || [];
  };

  const getUnreadCount = (projectId, lastRead) => {
    const projectMessages = messages[projectId] || [];
    if (!lastRead) return projectMessages.length;

    return projectMessages.filter(
      msg => new Date(msg.timestamp) > new Date(lastRead) && msg.sender !== currentUser
    ).length;
  };

  const markAsRead = (projectId) => {
    const timestamp = new Date().toISOString();
    localStorage.setItem(`meister-chat-lastread-${projectId}`, timestamp);
  };

  const getLastMessage = (projectId) => {
    const projectMessages = messages[projectId] || [];
    return projectMessages[projectMessages.length - 1] || null;
  };

  const clearProjectMessages = (projectId) => {
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[projectId];
      return newMessages;
    });
  };

  const value = {
    messages,
    globalMessages,
    currentUser,
    setCurrentUser,
    sendMessage,
    editMessage,
    deleteMessage,
    getProjectMessages,
    getUnreadCount,
    markAsRead,
    getLastMessage,
    clearProjectMessages,
    sendGlobalMessage,
    editGlobalMessage,
    deleteGlobalMessage,
    getGlobalMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};