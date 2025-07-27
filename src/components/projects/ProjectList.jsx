import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import ProjectForm from './ProjectForm';
import GlobalChat from '../chat/GlobalChat';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiFolder, FiCalendar, FiMapPin, FiMoreVertical, FiEdit2, FiTrash2, FiMessageSquare } = FiIcons;

const ProjectList = () => {
  const { projects, deleteProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showGlobalChat, setShowGlobalChat] = useState(false);

  const handleEdit = (project) => {
    setEditProject(project);
    setShowForm(true);
    setDropdownOpen(null);
  };

  const handleDelete = (projectId) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Projekt löschen möchten?')) {
      deleteProject(projectId);
    }
    setDropdownOpen(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projekte</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie Ihre Handwerksprojekte</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowGlobalChat(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <SafeIcon icon={FiMessageSquare} className="w-4 h-4" />
            <span>Firmen-Chat</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>Neues Projekt</span>
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <SafeIcon icon={FiFolder} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Projekte vorhanden</h3>
          <p className="text-gray-600 mb-4">Erstellen Sie Ihr erstes Projekt, um zu beginnen.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Projekt erstellen
            </button>
            <button
              onClick={() => setShowGlobalChat(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiMessageSquare} className="w-4 h-4" />
              <span>Zum Firmen-Chat</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {project.name}
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === project.id ? null : project.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <SafeIcon icon={FiMoreVertical} className="w-4 h-4 text-gray-500" />
                    </button>
                    {dropdownOpen === project.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => handleEdit(project)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                          <span>Bearbeiten</span>
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                          <span>Löschen</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                    <span>{project.customer}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                    <span>Erstellt: {formatDate(project.createdAt)}</span>
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <Link
                  to={`/project/${project.id}`}
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Projekt öffnen
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm
          project={editProject}
          onClose={() => {
            setShowForm(false);
            setEditProject(null);
          }}
        />
      )}

      {/* Global Chat Component */}
      <GlobalChat isOpen={showGlobalChat} onClose={() => setShowGlobalChat(false)} />
    </div>
  );
};

export default ProjectList;