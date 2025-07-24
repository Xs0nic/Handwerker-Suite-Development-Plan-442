import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useChat } from '../../contexts/ChatContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiClipboard, 
  FiCalculator, 
  FiFileText, 
  FiCamera, 
  FiCheckSquare, 
  FiPlus, 
  FiEdit2, 
  FiTrash2,
  FiMessageSquare,
  FiUsers,
  FiCalendar
} = FiIcons;

const ProjectCockpit = () => {
  const { id } = useParams();
  const { projects, updateProject } = useProjects();
  const { getLastMessage, getUnreadCount } = useChat();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    const currentProject = projects.find(p => p.id === id);
    setProject(currentProject);
    setTasks(currentProject?.tasks || []);
  }, [projects, id]);

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now().toString(),
        text: newTask,
        completed: false,
        createdAt: new Date().toISOString()
      };
      const updatedTasks = [...tasks, task];
      setTasks(updatedTasks);
      updateProject(id, { tasks: updatedTasks });
      setNewTask('');
      setShowAddTask(false);
    }
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    updateProject(id, { tasks: updatedTasks });
  };

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    updateProject(id, { tasks: updatedTasks });
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

  const modules = [
    {
      title: 'Aufmaß',
      description: 'Maße und Leistungen erfassen',
      icon: FiClipboard,
      path: `/project/${id}/measurement`,
      color: 'blue'
    },
    {
      title: 'Kalkulation',
      description: 'Materialberechnung und Einkaufsliste',
      icon: FiCalculator,
      path: `/project/${id}/calculation`,
      color: 'green'
    },
    {
      title: 'Projektplan',
      description: 'Termine und Mitarbeiter planen',
      icon: FiCalendar,
      path: `/project/${id}/plan`,
      color: 'purple'
    },
    {
      title: 'Team-Chat',
      description: 'Kommunikation mit dem Team',
      icon: FiMessageSquare,
      path: `/project/${id}/chat`,
      color: 'orange',
      badge: getUnreadCount(id, localStorage.getItem(`meister-chat-lastread-${id}`))
    }
  ];

  const lastMessage = getLastMessage(id);
  const planItems = project.planItems || [];
  const upcomingTasks = planItems
    .filter(item => new Date(item.startDate) >= new Date() && item.status !== 'completed')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">Kunde: {project.customer}</p>
            {project.address && (
              <p className="text-gray-600">{project.address}</p>
            )}
          </div>
          <Link to="/projects" className="text-blue-600 hover:text-blue-700 text-sm">
            Alle Projekte
          </Link>
        </div>
        {project.description && (
          <p className="text-gray-700">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {modules.map((module, index) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={module.path}
              className={`block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group relative`}
            >
              {module.badge && module.badge > 0 && (
                <div className="absolute top-4 right-4">
                  <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {module.badge > 9 ? '9+' : module.badge}
                  </span>
                </div>
              )}
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`w-12 h-12 bg-${module.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${module.color}-200 transition-colors`}>
                  <SafeIcon icon={module.icon} className={`w-6 h-6 text-${module.color}-600`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{module.description}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <SafeIcon icon={FiCheckSquare} className="w-5 h-5" />
              <span>Aufgaben</span>
            </h2>
            <button
              onClick={() => setShowAddTask(true)}
              className="text-blue-600 hover:text-blue-700 p-1"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded group"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {task.completed && (
                    <SafeIcon icon={FiCheckSquare} className="w-3 h-3 text-white" />
                  )}
                </button>
                <span
                  className={`flex-1 ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                >
                  <SafeIcon icon={FiTrash2} className="w-3 h-3" />
                </button>
              </div>
            ))}
            {showAddTask && (
              <div className="flex items-center space-x-2 p-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Neue Aufgabe..."
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={addTask}
                  className="text-green-600 hover:text-green-700 p-1"
                >
                  <SafeIcon icon={FiCheckSquare} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTask('');
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                </button>
              </div>
            )}
            {tasks.length === 0 && !showAddTask && (
              <p className="text-gray-500 text-sm text-center py-4">
                Keine Aufgaben vorhanden. Klicken Sie auf + um eine hinzuzufügen.
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <SafeIcon icon={FiCalendar} className="w-5 h-5" />
              <span>Anstehende Termine</span>
            </h2>
            <Link
              to={`/project/${id}/plan`}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Alle Termine
            </Link>
          </div>
          
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                      {item.status === 'geplant' ? 'Geplant' : item.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(item.startDate).toLocaleDateString('de-DE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    })} • {item.startTime?.substring(0, 5)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SafeIcon icon={FiCalendar} className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Keine anstehenden Termine</p>
                <Link
                  to={`/project/${id}/plan`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Termine planen
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chat Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <SafeIcon icon={FiMessageSquare} className="w-5 h-5" />
              <span>Team-Chat</span>
            </h2>
            <Link
              to={`/project/${id}/chat`}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
            >
              <span>Zum Chat</span>
              {getUnreadCount(id, localStorage.getItem(`meister-chat-lastread-${id}`)) > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getUnreadCount(id, localStorage.getItem(`meister-chat-lastread-${id}`)) > 9 
                    ? '9+' 
                    : getUnreadCount(id, localStorage.getItem(`meister-chat-lastread-${id}`))}
                </span>
              )}
            </Link>
          </div>
          
          <div className="space-y-3">
            {lastMessage ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiUsers} className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{lastMessage.sender}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(lastMessage.timestamp).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-900 line-clamp-2">{lastMessage.text}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SafeIcon icon={FiMessageSquare} className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Noch keine Nachrichten</p>
                <p className="text-sm">Starten Sie die Team-Kommunikation</p>
              </div>
            )}
            
            <Link
              to={`/project/${id}/chat`}
              className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Chat öffnen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCockpit;