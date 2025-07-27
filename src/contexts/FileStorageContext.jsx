import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FileStorageContext = createContext();

export const useFileStorage = () => {
  const context = useContext(FileStorageContext);
  if (!context) {
    throw new Error('useFileStorage must be used within a FileStorageProvider');
  }
  return context;
};

export const FileStorageProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const { currentUser, currentCompany } = useAuth();

  // Initialize with demo data
  useEffect(() => {
    if (currentUser && currentCompany) {
      // Default folders with role-based permissions
      const defaultFolders = [
        {
          id: 'folder-1',
          name: 'Bilder',
          project_id: 'project-1',
          parent_folder_id: null,
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: '#10b981',
          description: 'Projektbilder und Fotos',
          role_permissions: {
            administrator: { view: true, create: true, edit: true, delete: true },
            foreman: { view: true, create: true, edit: true, delete: false },
            employee: { view: true, create: true, edit: false, delete: false }
          }
        },
        {
          id: 'folder-2',
          name: 'Verträge',
          project_id: 'project-1',
          parent_folder_id: null,
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: '#ef4444',
          description: 'Verträge und rechtliche Dokumente',
          role_permissions: {
            administrator: { view: true, create: true, edit: true, delete: true },
            foreman: { view: true, create: true, edit: true, delete: false },
            employee: { view: false, create: false, edit: false, delete: false }
          }
        },
        {
          id: 'folder-3',
          name: 'Pläne',
          project_id: 'project-1',
          parent_folder_id: null,
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: '#3b82f6',
          description: 'Baupläne und technische Zeichnungen',
          role_permissions: {
            administrator: { view: true, create: true, edit: true, delete: true },
            foreman: { view: true, create: true, edit: true, delete: false },
            employee: { view: true, create: false, edit: false, delete: false }
          }
        },
        {
          id: 'folder-4',
          name: 'Rechnungen',
          project_id: 'project-1',
          parent_folder_id: null,
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: '#f59e0b',
          description: 'Rechnungen und Kostenvoranschläge',
          role_permissions: {
            administrator: { view: true, create: true, edit: true, delete: true },
            foreman: { view: true, create: false, edit: false, delete: false },
            employee: { view: false, create: false, edit: false, delete: false }
          }
        }
      ];

      // Demo files
      const defaultFiles = [
        {
          id: 'file-1',
          name: 'Badezimmer_Vorher.jpg',
          original_name: 'Badezimmer_Vorher.jpg',
          file_type: 'image/jpeg',
          file_size: 2048576, // 2MB
          file_path: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
          project_id: 'project-1',
          folder_id: 'folder-1',
          uploaded_by: 'user-1',
          uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Zustand vor der Renovierung',
          tags: ['vorher', 'badezimmer'],
          version: 1,
          is_latest_version: true
        },
        {
          id: 'file-2',
          name: 'Vertrag_Müller.pdf',
          original_name: 'Vertrag_Familie_Müller.pdf',
          file_type: 'application/pdf',
          file_size: 1024000, // 1MB
          file_path: '/demo/files/Vertrag_Müller.pdf',
          project_id: 'project-1',
          folder_id: 'folder-2',
          uploaded_by: 'user-1',
          uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Hauptvertrag mit Familie Müller',
          tags: ['vertrag', 'müller'],
          version: 1,
          is_latest_version: true
        },
        {
          id: 'file-3',
          name: 'Grundriss_Bad.pdf',
          original_name: 'Grundriss_Badezimmer.pdf',
          file_type: 'application/pdf',
          file_size: 512000, // 512KB
          file_path: '/demo/files/Grundriss_Bad.pdf',
          project_id: 'project-1',
          folder_id: 'folder-3',
          uploaded_by: 'user-1',
          uploaded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Technischer Grundriss des Badezimmers',
          tags: ['grundriss', 'badezimmer', 'technisch'],
          version: 1,
          is_latest_version: true
        },
        {
          id: 'file-4',
          name: 'Badezimmer_Nachher.jpg',
          original_name: 'Badezimmer_Nachher.jpg',
          file_type: 'image/jpeg',
          file_size: 1856743, // 1.8MB
          file_path: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800',
          project_id: 'project-1',
          folder_id: 'folder-1',
          uploaded_by: 'user-1',
          uploaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Fertiggestelltes Badezimmer',
          tags: ['nachher', 'badezimmer', 'fertig'],
          version: 1,
          is_latest_version: true
        },
        {
          id: 'file-5',
          name: 'Materialien_Liste.pdf',
          original_name: 'Materialien_Liste.pdf',
          file_type: 'application/pdf',
          file_size: 245760, // 240KB
          file_path: '/demo/files/Materialien_Liste.pdf',
          project_id: 'project-1',
          folder_id: 'folder-4',
          uploaded_by: 'user-1',
          uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Liste aller verwendeten Materialien',
          tags: ['materialien', 'liste', 'rechnung'],
          version: 1,
          is_latest_version: true
        }
      ];

      setFolders(defaultFolders);
      setFiles(defaultFiles);
    }
  }, [currentUser, currentCompany]);

  // Get folders for a project
  const getFolders = (projectId, parentFolderId = null) => {
    return folders.filter(folder => 
      folder.project_id === projectId && 
      folder.parent_folder_id === parentFolderId
    );
  };

  // Get files for a project/folder
  const getFiles = (projectId, folderId = null) => {
    return files.filter(file => 
      file.project_id === projectId && 
      file.folder_id === folderId
    );
  };

  // Check if user has permission for a folder
  const hasFilePermission = (folder, action) => {
    if (!currentUser || !folder.role_permissions) return false;
    
    // Administratoren haben immer alle Rechte
    if (currentUser.role.id === 'administrator') return true;
    
    const userRole = currentUser.role.id;
    return folder.role_permissions[userRole]?.[action] || false;
  };

  // Create folder - IMPROVED VERSION with better state management
  const createFolder = async (projectId, folderData) => {
    try {
      const newFolder = {
        id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        ...folderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Ensure role_permissions are set
        role_permissions: folderData.permissions || {
          administrator: { view: true, create: true, edit: true, delete: true },
          foreman: { view: true, create: true, edit: true, delete: false },
          employee: { view: true, create: false, edit: false, delete: false }
        }
      };
      
      console.log("Creating new folder:", newFolder);
      
      // Update state synchronously and return the new folder
      setFolders(prev => {
        const updated = [...prev, newFolder];
        console.log("Updated folders state:", updated);
        return updated;
      });
      
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  };

  // Update folder
  const updateFolder = async (folderId, updates) => {
    try {
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, ...updates, updated_at: new Date().toISOString() }
          : folder
      ));
      
      console.log("Updated folder with ID:", folderId);
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  };

  // Delete folder
  const deleteFolder = async (folderId) => {
    try {
      // Remove folder and all its subfolders
      const foldersToDelete = [folderId];
      let i = 0;
      while (i < foldersToDelete.length) {
        const currentFolderId = foldersToDelete[i];
        const subfolders = folders.filter(f => f.parent_folder_id === currentFolderId);
        foldersToDelete.push(...subfolders.map(f => f.id));
        i++;
      }

      // Remove folders
      setFolders(prev => prev.filter(folder => !foldersToDelete.includes(folder.id)));
      
      // Remove files in deleted folders
      setFiles(prev => prev.filter(file => !foldersToDelete.includes(file.folder_id)));
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  };

  // Upload file (simulated)
  const uploadFile = async (projectId, fileData) => {
    try {
      const { file, folder_id, uploaded_by, onProgress } = fileData;
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        onProgress?.(Math.round(progress));
      }, 200);

      // Wait for upload simulation
      await new Promise(resolve => {
        const checkProgress = () => {
          if (progress >= 100) {
            resolve();
          } else {
            setTimeout(checkProgress, 100);
          }
        };
        checkProgress();
      });

      // Create file record
      const newFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: URL.createObjectURL(file), // For demo - create blob URL
        project_id: projectId,
        folder_id: folder_id,
        uploaded_by: uploaded_by,
        uploaded_at: new Date().toISOString(),
        description: '',
        tags: [],
        version: 1,
        is_latest_version: true
      };

      setFiles(prev => [...prev, newFile]);
      return newFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Update file
  const updateFile = async (fileId, updates) => {
    try {
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, ...updates, updated_at: new Date().toISOString() }
          : file
      ));
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    try {
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  // Get folder by ID
  const getFolderById = (folderId) => {
    return folders.find(folder => folder.id === folderId);
  };

  // Get file by ID
  const getFileById = (fileId) => {
    return files.find(file => file.id === fileId);
  };

  // Get folder path (breadcrumbs)
  const getFolderPath = (folderId) => {
    const path = [];
    let currentFolder = getFolderById(folderId);
    
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = currentFolder.parent_folder_id 
        ? getFolderById(currentFolder.parent_folder_id) 
        : null;
    }
    
    return path;
  };

  const value = {
    folders,
    files,
    getFolders,
    getFiles,
    getFolderById,
    getFileById,
    getFolderPath,
    hasFilePermission,
    createFolder,
    updateFolder,
    deleteFolder,
    uploadFile,
    updateFile,
    deleteFile
  };

  return (
    <FileStorageContext.Provider value={value}>
      {children}
    </FileStorageContext.Provider>
  );
};