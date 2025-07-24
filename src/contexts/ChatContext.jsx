import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    const savedMessages = localStorage.getItem('meister-chat-messages');
    const savedUser = localStorage.getItem('meister-chat-user');
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('meister-chat-messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = (projectId, messageData) => {
    const newMessage = {
      id: Date.now().toString(),
      ...messageData,
      timestamp: new Date().toISOString(),
      edited: false
    };

    setMessages(prev => ({
      ...prev,
      [projectId]: [
        ...(prev[projectId] || []),
        newMessage
      ]
    }));
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

  const getProjectMessages = (projectId) => {
    return messages[projectId] || [];
  };

  const getUnreadCount = (projectId, lastRead) => {
    const projectMessages = messages[projectId] || [];
    if (!lastRead) return projectMessages.length;
    
    return projectMessages.filter(msg => 
      new Date(msg.timestamp) > new Date(lastRead) && msg.sender !== currentUser
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
    currentUser,
    setCurrentUser,
    sendMessage,
    editMessage,
    deleteMessage,
    getProjectMessages,
    getUnreadCount,
    markAsRead,
    getLastMessage,
    clearProjectMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};