import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFileStorage } from '../../contexts/FileStorageContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiArrowLeft, FiPlus, FiFolder, FiFile, FiDownload, FiEdit2, FiTrash2, FiUpload, FiX, FiCheck, FiEye, FiMoreVertical, FiImage, FiFileText, FiArchive, FiList, FiGrid, FiMaximize2, FiMinimize2, FiRotateCw, FiShare2, FiCopy, FiInfo, FiSave, FiShield, FiLock } = FiIcons;

const FileStorageModule = () => {
  const { id } = useParams();
  const { projects } = useProjects();
  const { currentUser, hasPermission, getAvailableRoles } = useAuth();
  const { folders: contextFolders, getFolders, getFiles, createFolder, updateFolder, deleteFolder, uploadFile, deleteFile, updateFile, hasFilePermission } = useFileStorage();

  const [project, setProject] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showPermissionsTab, setShowPermissionsTab] = useState(false);

  // Preview and Edit States
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showEditFile, setShowEditFile] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [editFileForm, setEditFileForm] = useState({
    name: '',
    description: '',
    tags: []
  });
  const [previewMode, setPreviewMode] = useState('normal'); // 'normal', 'fullscreen'

  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    permissions: {
      administrator: { view: true, create: true, edit: true, delete: true },
      foreman: { view: true, create: true, edit: true, delete: false },
      employee: { view: true, create: false, edit: false, delete: false }
    }
  });

  // Verfügbare Rollen für die Berechtigungseinstellungen
  const availableRoles = getAvailableRoles();

  // Load initial data
  useEffect(() => {
    const currentProject = projects.find(p => p.id === id);
    setProject(currentProject);
    loadData();
  }, [projects, id]);

  // React to context changes - IMPROVED VERSION
  useEffect(() => {
    console.log("Context folders changed:", contextFolders);
    loadData();
  }, [contextFolders, id, currentFolder]);

  // React to current folder changes
  useEffect(() => {
    loadData();
  }, [currentFolder]);

  // UNIFIED data loading function
  const loadData = () => {
    const projectFolders = getFolders(id, currentFolder?.id);
    const visibleFolders = projectFolders.filter(folder =>
      hasFilePermission(folder, 'view')
    );
    const projectFiles = getFiles(id, currentFolder?.id);

    console.log("Loading data for project:", id, "current folder:", currentFolder?.id);
    console.log("Found folders:", visibleFolders);
    console.log("Found files:", projectFiles);

    setFolders(visibleFolders);
    setFiles(projectFiles);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      console.log("Creating folder with data:", folderForm);
      const newFolder = await createFolder(id, {
        ...folderForm,
        parent_folder_id: currentFolder?.id || null,
        created_by: currentUser.id
      });
      console.log("Folder created successfully:", newFolder);
      setShowCreateFolder(false);
      resetFolderForm();
      // Data will be reloaded automatically via useEffect
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleEditFolder = async (e) => {
    e.preventDefault();
    try {
      await updateFolder(editingFolder.id, folderForm);
      setShowEditFolder(false);
      setEditingFolder(null);
      resetFolderForm();
      setShowPermissionsTab(false);
      // Data will be reloaded automatically via useEffect
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (window.confirm(`Sind Sie sicher, dass Sie den Ordner "${folder.name}" und alle Inhalte löschen möchten?`)) {
      try {
        await deleteFolder(folder.id);
        setDropdownOpen(null);
        // Data will be reloaded automatically via useEffect
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        await uploadFile(id, {
          file,
          folder_id: currentFolder?.id || null,
          uploaded_by: currentUser.id,
          onProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 2000);

      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }

    setShowUploadFile(false);
    // Data will be reloaded automatically via useEffect
  };

  const handleDeleteFile = async (file) => {
    if (window.confirm(`Sind Sie sicher, dass Sie die Datei "${file.original_name}" löschen möchten?`)) {
      try {
        await deleteFile(file.id);
        setDropdownOpen(null);
        if (previewFile?.id === file.id) {
          setShowPreview(false);
          setPreviewFile(null);
        }
        // Data will be reloaded automatically via useEffect
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleEditFile = async (e) => {
    e.preventDefault();
    try {
      await updateFile(editingFile.id, {
        original_name: editFileForm.name,
        description: editFileForm.description,
        tags: editFileForm.tags
      });

      setShowEditFile(false);
      setEditingFile(null);
      resetEditFileForm();

      // Update preview if it's the same file
      if (previewFile?.id === editingFile.id) {
        setPreviewFile(prev => ({
          ...prev,
          original_name: editFileForm.name,
          description: editFileForm.description,
          tags: editFileForm.tags
        }));
      }

      // Data will be reloaded automatically via useEffect
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const handleDownloadFile = (file) => {
    // In a real application, this would trigger a proper download
    const link = document.createElement('a');
    link.href = file.file_path;
    link.download = file.original_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDropdownOpen(null);
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setShowPreview(true);
    setDropdownOpen(null);
  };

  const handleShareFile = async (file) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: file.original_name,
          text: `Datei: ${file.original_name}`,
          url: file.file_path
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(file.file_path);
        alert('Link wurde in die Zwischenablage kopiert!');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
    }
    setDropdownOpen(null);
  };

  const startEditFile = (file) => {
    setEditingFile(file);
    setEditFileForm({
      name: file.original_name,
      description: file.description || '',
      tags: file.tags || []
    });
    setShowEditFile(true);
    setDropdownOpen(null);
  };

  const resetFolderForm = () => {
    setFolderForm({
      name: '',
      description: '',
      color: '#3b82f6',
      permissions: {
        administrator: { view: true, create: true, edit: true, delete: true },
        foreman: { view: true, create: true, edit: true, delete: false },
        employee: { view: true, create: false, edit: false, delete: false }
      }
    });
    setShowPermissionsTab(false);
  };

  const resetEditFileForm = () => {
    setEditFileForm({
      name: '',
      description: '',
      tags: []
    });
  };

  const startEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      description: folder.description || '',
      color: folder.color || '#3b82f6',
      permissions: folder.role_permissions || folderForm.permissions
    });
    setShowEditFolder(true);
    setDropdownOpen(null);
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return FiImage;
    if (fileType.includes('pdf')) return FiFileText;
    if (fileType.includes('zip') || fileType.includes('rar')) return FiArchive;
    return FiFile;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canPreviewFile = (fileType) => {
    return fileType.startsWith('image/') || fileType.includes('pdf') || fileType.includes('text/');
  };

  const renderPreview = (file) => {
    if (file.file_type.startsWith('image/')) {
      return (
        <img
          src={file.file_path}
          alt={file.original_name}
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: previewMode === 'fullscreen' ? '90vh' : '60vh' }}
        />
      );
    }

    if (file.file_type.includes('pdf')) {
      return (
        <iframe
          src={file.file_path}
          className="w-full border-0"
          style={{ height: previewMode === 'fullscreen' ? '90vh' : '60vh' }}
          title={file.original_name}
        />
      );
    }

    if (file.file_type.includes('text/')) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm">
            Textvorschau für {file.original_name}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <SafeIcon icon={getFileIcon(file.file_type)} className="w-16 h-16 mb-4" />
        <p>Keine Vorschau verfügbar</p>
        <p className="text-sm">Dateityp: {file.file_type}</p>
      </div>
    );
  };

  // Toggle permission for a specific role and action
  const togglePermission = (roleId, action) => {
    setFolderForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [roleId]: {
          ...prev.permissions[roleId],
          [action]: !prev.permissions[roleId]?.[action]
        }
      }
    }));
  };

  const breadcrumbs = [];
  let current = currentFolder;
  while (current) {
    breadcrumbs.unshift(current);
    current = current.parent_folder_id ? folders.find(f => f.id === current.parent_folder_id) : null;
  }

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to={`/project/${id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dateiablage</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <SafeIcon icon={viewMode === 'grid' ? FiList : FiGrid} className="w-5 h-5" />
          </button>
          {hasPermission('files', 'create') && (
            <>
              <button
                onClick={() => setShowUploadFile(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiUpload} className="w-4 h-4" />
                <span>Dateien hochladen</span>
              </button>
              <button
                onClick={() => setShowCreateFolder(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4" />
                <span>Ordner erstellen</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <nav className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setCurrentFolder(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Dateiablage
          </button>
          {breadcrumbs.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => setCurrentFolder(folder)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {Object.keys(uploadProgress).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
          >
            <h3 className="font-medium text-gray-900 mb-3">Upload-Fortschritt</h3>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{fileName}</span>
                      <span className="text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-12">
              <SafeIcon icon={FiFolder} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Dateien vorhanden</h3>
              <p className="text-gray-600 mb-4">
                {currentFolder ? 'Dieser Ordner ist leer.' : 'Erstellen Sie Ihren ersten Ordner oder laden Sie Dateien hoch.'}
              </p>
              {hasPermission('files', 'create') && (
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ordner erstellen
                  </button>
                  <button
                    onClick={() => setShowUploadFile(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Dateien hochladen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 'space-y-2'}>
              {/* Folders */}
              {folders.map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={viewMode === 'grid' ? 'group cursor-pointer relative' : 'flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group'}
                >
                  <div
                    onClick={() => setCurrentFolder(folder)}
                    className={viewMode === 'grid' ? 'flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors' : 'flex items-center flex-1 min-w-0'}
                  >
                    <div className={viewMode === 'grid' ? 'mb-2' : 'mr-3'}>
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: folder.color + '20', color: folder.color }}
                      >
                        <SafeIcon icon={FiFolder} className="w-6 h-6" />
                      </div>
                    </div>
                    <div className={viewMode === 'grid' ? 'text-center' : 'flex-1 min-w-0'}>
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
                        {!folder.role_permissions?.employee?.view && (
                          <SafeIcon icon={FiLock} className="w-3 h-3 ml-1 text-gray-500" title="Beschränkter Zugriff" />
                        )}
                      </div>
                      {folder.description && viewMode === 'list' && (
                        <p className="text-xs text-gray-500 truncate">{folder.description}</p>
                      )}
                    </div>
                  </div>
                  {hasFilePermission(folder, 'edit') && (
                    <div className={`relative ${viewMode === 'grid' ? 'opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2' : ''}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === folder.id ? null : folder.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <SafeIcon icon={FiMoreVertical} className="w-4 h-4 text-gray-500" />
                      </button>
                      {dropdownOpen === folder.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                          {hasFilePermission(folder, 'edit') && (
                            <button
                              onClick={() => startEditFolder(folder)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                              <span>Bearbeiten</span>
                            </button>
                          )}
                          {hasFilePermission(folder, 'delete') && (
                            <button
                              onClick={() => handleDeleteFolder(folder)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                              <span>Löschen</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Files */}
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (folders.length + index) * 0.05 }}
                  className={viewMode === 'grid' ? 'group cursor-pointer relative' : 'flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group'}
                >
                  <div
                    onClick={() => canPreviewFile(file.file_type) ? handlePreviewFile(file) : handleDownloadFile(file)}
                    className={viewMode === 'grid' ? 'flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors' : 'flex items-center flex-1 min-w-0'}
                  >
                    <div className={viewMode === 'grid' ? 'mb-2' : 'mr-3'}>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <SafeIcon icon={getFileIcon(file.file_type)} className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                    <div className={viewMode === 'grid' ? 'text-center' : 'flex-1 min-w-0'}>
                      <p className="text-sm font-medium text-gray-900 truncate">{file.original_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file_size)}
                        {viewMode === 'list' && ` • ${formatDate(file.uploaded_at)}`}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 ${viewMode === 'grid' ? 'opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2' : ''}`}>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === file.id ? null : file.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <SafeIcon icon={FiMoreVertical} className="w-4 h-4 text-gray-500" />
                      </button>
                      {dropdownOpen === file.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
                          {canPreviewFile(file.file_type) && (
                            <button
                              onClick={() => handlePreviewFile(file)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <SafeIcon icon={FiEye} className="w-4 h-4" />
                              <span>Vorschau</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <SafeIcon icon={FiDownload} className="w-4 h-4" />
                            <span>Herunterladen</span>
                          </button>
                          {hasPermission('files', 'edit') && (
                            <button
                              onClick={() => startEditFile(file)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                              <span>Bearbeiten</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleShareFile(file)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <SafeIcon icon={FiShare2} className="w-4 h-4" />
                            <span>Teilen</span>
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(file.file_path);
                              setDropdownOpen(null);
                              alert('Link kopiert!');
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <SafeIcon icon={FiCopy} className="w-4 h-4" />
                            <span>Link kopieren</span>
                          </button>
                          {hasPermission('files', 'delete') && (
                            <button
                              onClick={() => handleDeleteFile(file)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                              <span>Löschen</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      {showPreview && previewFile && (
        <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 ${previewMode === 'fullscreen' ? 'bg-opacity-95' : ''}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-lg shadow-xl ${previewMode === 'fullscreen' ? 'w-full h-full' : 'max-w-4xl max-h-[90vh]'} overflow-hidden`}
          >
            {/* Preview Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={getFileIcon(previewFile.file_type)} className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{previewFile.original_name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(previewFile.file_size)} • {formatDate(previewFile.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode(previewMode === 'fullscreen' ? 'normal' : 'fullscreen')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={previewMode === 'fullscreen' ? 'Normaler Modus' : 'Vollbild'}
                >
                  <SafeIcon icon={previewMode === 'fullscreen' ? FiMinimize2 : FiMaximize2} className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDownloadFile(previewFile)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Herunterladen"
                >
                  <SafeIcon icon={FiDownload} className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewFile(null);
                    setPreviewMode('normal');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className={`${previewMode === 'fullscreen' ? 'h-full' : 'max-h-96'} overflow-auto flex items-center justify-center p-4`}>
              {renderPreview(previewFile)}
            </div>

            {/* Preview Footer */}
            {previewFile.description && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-700">{previewFile.description}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Edit File Modal */}
      {showEditFile && editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Datei bearbeiten</h2>
              <button
                onClick={() => {
                  setShowEditFile(false);
                  setEditingFile(null);
                  resetEditFileForm();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEditFile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dateiname *
                </label>
                <input
                  type="text"
                  required
                  value={editFileForm.name}
                  onChange={(e) => setEditFileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={editFileForm.description}
                  onChange={(e) => setEditFileForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Beschreibung der Datei..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditFile(false);
                    setEditingFile(null);
                    resetEditFileForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiSave} className="w-4 h-4" />
                  <span>Speichern</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Neuen Ordner erstellen</h2>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPermissionsTab(false)}
                  className={`px-4 py-2 rounded-lg ${!showPermissionsTab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  Allgemein
                </button>
                <button
                  onClick={() => setShowPermissionsTab(true)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-1 ${showPermissionsTab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  <SafeIcon icon={FiShield} className="w-4 h-4" />
                  <span>Berechtigungen</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
              {!showPermissionsTab ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordnername *
                    </label>
                    <input
                      type="text"
                      required
                      value={folderForm.name}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="z.B. Verträge, Bilder, Pläne"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschreibung
                    </label>
                    <textarea
                      value={folderForm.description}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Kurze Beschreibung des Ordnerinhalts..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Farbe
                    </label>
                    <div className="flex space-x-2">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFolderForm(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${folderForm.color === color ? 'border-gray-400' : 'border-gray-200'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                    <SafeIcon icon={FiShield} className="w-5 h-5 mr-2" />
                    <span>Zugriffsberechtigungen</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Legen Sie fest, welche Rollen Zugriff auf diesen Ordner haben sollen und welche Aktionen sie ausführen dürfen.
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Anzeigen</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellen</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bearbeiten</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Löschen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {availableRoles.map((role) => (
                          <tr key={role.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.view || false}
                                onChange={() => togglePermission(role.id, 'view')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.create || false}
                                onChange={() => togglePermission(role.id, 'create')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.edit || false}
                                onChange={() => togglePermission(role.id, 'edit')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.delete || false}
                                onChange={() => togglePermission(role.id, 'delete')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Hinweis:</strong> Administratoren haben immer Vollzugriff auf alle Ordner. Für andere Rollen können Sie die Berechtigungen individuell anpassen.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiCheck} className="w-4 h-4" />
                  <span>Erstellen</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {showEditFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Ordner bearbeiten</h2>
              <button
                onClick={() => {
                  setShowEditFolder(false);
                  setShowPermissionsTab(false);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPermissionsTab(false)}
                  className={`px-4 py-2 rounded-lg ${!showPermissionsTab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  Allgemein
                </button>
                <button
                  onClick={() => setShowPermissionsTab(true)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-1 ${showPermissionsTab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  <SafeIcon icon={FiShield} className="w-4 h-4" />
                  <span>Berechtigungen</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleEditFolder} className="p-6 space-y-4">
              {!showPermissionsTab ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordnername *
                    </label>
                    <input
                      type="text"
                      required
                      value={folderForm.name}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschreibung
                    </label>
                    <textarea
                      value={folderForm.description}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Farbe
                    </label>
                    <div className="flex space-x-2">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFolderForm(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${folderForm.color === color ? 'border-gray-400' : 'border-gray-200'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                    <SafeIcon icon={FiShield} className="w-5 h-5 mr-2" />
                    <span>Zugriffsberechtigungen</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Legen Sie fest, welche Rollen Zugriff auf diesen Ordner haben sollen und welche Aktionen sie ausführen dürfen.
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Anzeigen</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellen</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bearbeiten</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Löschen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {availableRoles.map((role) => (
                          <tr key={role.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.view || false}
                                onChange={() => togglePermission(role.id, 'view')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={role.id === 'administrator'} // Administratoren haben immer alle Rechte
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.create || false}
                                onChange={() => togglePermission(role.id, 'create')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={role.id === 'administrator'} // Administratoren haben immer alle Rechte
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.edit || false}
                                onChange={() => togglePermission(role.id, 'edit')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={role.id === 'administrator'} // Administratoren haben immer alle Rechte
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={folderForm.permissions[role.id]?.delete || false}
                                onChange={() => togglePermission(role.id, 'delete')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={role.id === 'administrator'} // Administratoren haben immer alle Rechte
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Hinweis:</strong> Administratoren haben immer Vollzugriff auf alle Ordner. Für andere Rollen können Sie die Berechtigungen individuell anpassen.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditFolder(false);
                    setShowPermissionsTab(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiCheck} className="w-4 h-4" />
                  <span>Speichern</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Dateien hochladen</h2>
              <button
                onClick={() => setShowUploadFile(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <SafeIcon icon={FiUpload} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Wählen Sie Dateien aus oder ziehen Sie sie hierher
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                >
                  Dateien auswählen
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Unterstützte Dateiformate: PDF, DOC, XLS, JPG, PNG, ZIP (max. 10MB pro Datei)
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FileStorageModule;