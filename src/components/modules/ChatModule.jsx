import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiArrowLeft, FiSend, FiPaperclip, FiMoreVertical, FiEdit2, FiTrash2, FiUser, FiClock } = FiIcons;

const ChatModule = () => {
  const { id } = useParams();
  const { projects } = useProjects();
  const { currentUser } = useAuth();
  const { getProjectMessages, sendMessage, deleteMessage, editMessage, setCurrentUser } = useChat();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const currentProject = projects.find(p => p.id === id);
    setProject(currentProject);
    setMessages(getProjectMessages(id));
    
    // Automatically set the chat username to the current user's name
    if (currentUser?.name) {
      setCurrentUser(currentUser.name);
    }
    
  }, [projects, id, getProjectMessages, setCurrentUser, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser?.name) {
      sendMessage(id, {
        text: newMessage.trim(),
        sender: currentUser.name,
        timestamp: new Date().toISOString()
      });
      setMessages(getProjectMessages(id));
      setNewMessage('');
    }
  };

  const handleEditMessage = (messageId, newText) => {
    editMessage(id, messageId, newText);
    setMessages(getProjectMessages(id));
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Nachricht löschen möchten?')) {
      deleteMessage(id, messageId);
      setMessages(getProjectMessages(id));
    }
    setDropdownOpen(null);
  };

  const startEdit = (message) => {
    setEditingMessage(message.id);
    setEditText(message.text);
    setDropdownOpen(null);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Projekt nicht gefunden</p>
          <Link to="/projects" className="text-blue-600 hover:underline mt-2 inline-block">
            Zurück zu Projekten
          </Link>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to={`/project/${id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projekt-Chat</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            Angemeldet als: <span className="font-medium">{currentUser?.name}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white border-l border-r border-gray-200 overflow-y-auto p-4 space-y-4">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Noch keine Nachrichten vorhanden</p>
            <p className="text-sm">Starten Sie die Unterhaltung!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                  {new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                </div>
              </div>

              {/* Messages for this date */}
              {dayMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === currentUser?.name ? 'justify-end' : 'justify-start'} mb-3`}
                >
                  <div className={`max-w-xs lg:max-w-md group ${message.sender === currentUser?.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2 relative`}>
                    {/* Message Options */}
                    {message.sender === currentUser?.name && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === message.id ? null : message.id)}
                            className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                          >
                            <SafeIcon icon={FiMoreVertical} className="w-3 h-3" />
                          </button>
                          {dropdownOpen === message.id && (
                            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                              <button
                                onClick={() => startEdit(message)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <SafeIcon icon={FiEdit2} className="w-3 h-3" />
                                <span>Bearbeiten</span>
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <SafeIcon icon={FiTrash2} className="w-3 h-3" />
                                <span>Löschen</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sender name (for messages from others) */}
                    {message.sender !== currentUser?.name && (
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {message.sender}
                      </div>
                    )}

                    {/* Message content */}
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded resize-none bg-white text-gray-900"
                          rows="2"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditMessage(message.id, editText)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Speichern
                          </button>
                          <button
                            onClick={() => { setEditingMessage(null); setEditText(''); }}
                            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        {message.edited && (
                          <p className="text-xs opacity-75 mt-1">(bearbeitet)</p>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 flex items-center space-x-1 ${message.sender === currentUser?.name ? 'text-blue-100' : 'text-gray-500'}`}>
                      <SafeIcon icon={FiClock} className="w-3 h-3" />
                      <span>{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Nachricht eingeben... (Enter zum Senden, Shift+Enter für neue Zeile)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Datei anhängen (kommt bald)"
            >
              <SafeIcon icon={FiPaperclip} className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiSend} className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModule;