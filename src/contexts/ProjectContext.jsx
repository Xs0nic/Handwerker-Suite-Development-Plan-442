import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabase';

const ProjectContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const { currentUser, currentCompany } = useAuth();

  // Load projects from localStorage when the component mounts
  useEffect(() => {
    if (currentUser && currentCompany) {
      // Try to load projects from localStorage first
      const savedProjects = localStorage.getItem(`meister-projects-${currentUser.id}`);
      
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects);
          setProjects(parsedProjects);
          console.log('Loaded projects from localStorage:', parsedProjects.length);
        } catch (error) {
          console.error('Error parsing saved projects:', error);
          initializeDemoProjects();
        }
      } else {
        // Initialize with demo projects if nothing is saved
        initializeDemoProjects();
      }
    }
  }, [currentUser, currentCompany]);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (currentUser && projects.length > 0) {
      localStorage.setItem(`meister-projects-${currentUser.id}`, JSON.stringify(projects));
      console.log('Saved projects to localStorage:', projects.length);
    }
  }, [projects, currentUser]);

  const initializeDemoProjects = () => {
    // Initialize with demo projects
    const demoProjects = [
      {
        id: 'project-1',
        name: 'Renovierung Bad Müller',
        customer: 'Familie Müller',
        address: 'Müllerstraße 123, 12345 Berlin',
        description: 'Komplette Badrenovierung mit neuen Fliesen und Sanitäranlagen',
        company_id: currentCompany.id,
        created_by: currentUser.id,
        created_at: '2023-06-15T10:30:00.000Z',
        updated_at: null,
        tasks: [
          {
            id: 'task-1',
            text: 'Fliesen ausmessen',
            completed: true,
            createdAt: '2023-06-16T08:00:00.000Z'
          },
          {
            id: 'task-2',
            text: 'Sanitäranlagen bestellen',
            completed: false,
            createdAt: '2023-06-16T09:00:00.000Z'
          }
        ],
        planItems: [
          {
            id: 'plan-1',
            title: 'Fliesen verlegen',
            description: 'Badezimmer komplett neu fliesen',
            startDate: '2023-07-01',
            endDate: '2023-07-03',
            startTime: '08:00',
            endTime: '17:00',
            status: 'geplant',
            priority: 'normal',
            assignedEmployees: []
          }
        ]
      },
      {
        id: 'project-2',
        name: 'Küche Schmidt',
        customer: 'Familie Schmidt',
        address: 'Schmidtstraße 45, 10115 Berlin',
        description: 'Küchenrenovierung mit neuen Elektrogeräten',
        company_id: currentCompany.id,
        created_by: currentUser.id,
        created_at: '2023-06-20T14:15:00.000Z',
        updated_at: null,
        tasks: [],
        planItems: []
      }
    ];
    
    setProjects(demoProjects);
    localStorage.setItem(`meister-projects-${currentUser.id}`, JSON.stringify(demoProjects));
    console.log('Initialized demo projects in localStorage');
  };

  const createProject = async (projectData) => {
    try {
      // Generate a unique ID
      const id = `project-${Date.now()}`;
      
      // Create a new project object
      const newProject = {
        id,
        ...projectData,
        company_id: currentCompany.id,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: null,
        tasks: [],
        planItems: []
      };
      
      // Add to projects array
      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      
      // Explicitly save to localStorage for redundancy
      localStorage.setItem(`meister-projects-${currentUser.id}`, JSON.stringify(updatedProjects));
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (id, updates) => {
    try {
      const updatedProjects = projects.map(project => 
        project.id === id 
          ? { ...project, ...updates, updated_at: new Date().toISOString() } 
          : project
      );
      
      setProjects(updatedProjects);
      
      // Explicitly save to localStorage for redundancy
      localStorage.setItem(`meister-projects-${currentUser.id}`, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      const filteredProjects = projects.filter(project => project.id !== id);
      setProjects(filteredProjects);
      
      // Explicitly save to localStorage for redundancy
      localStorage.setItem(`meister-projects-${currentUser.id}`, JSON.stringify(filteredProjects));
      
      // Also delete associated measurements and calculations
      localStorage.removeItem(`measurements-${id}`);
      localStorage.removeItem(`calculations-${id}`);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  // Mock measurement functions
  const addMeasurement = async (projectId, measurement) => {
    try {
      const measurementId = `measurement-${Date.now()}`;
      const newMeasurement = {
        id: measurementId,
        ...measurement,
        project_id: projectId,
        created_by: currentUser.id,
        created_at: new Date().toISOString()
      };
      
      // Store in local storage for demo purposes
      const storageKey = `measurements-${projectId}`;
      const existingMeasurements = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([...existingMeasurements, newMeasurement]));
      
      return newMeasurement;
    } catch (error) {
      console.error('Error adding measurement:', error);
      throw error;
    }
  };

  const updateMeasurement = async (projectId, measurementId, updates) => {
    try {
      const storageKey = `measurements-${projectId}`;
      const measurements = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedMeasurements = measurements.map(item => 
        item.id === measurementId 
          ? { ...item, ...updates, updated_at: new Date().toISOString() } 
          : item
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedMeasurements));
    } catch (error) {
      console.error('Error updating measurement:', error);
      throw error;
    }
  };

  const deleteMeasurement = async (projectId, measurementId) => {
    try {
      const storageKey = `measurements-${projectId}`;
      const measurements = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const filteredMeasurements = measurements.filter(item => item.id !== measurementId);
      localStorage.setItem(storageKey, JSON.stringify(filteredMeasurements));
    } catch (error) {
      console.error('Error deleting measurement:', error);
      throw error;
    }
  };

  const getProjectMeasurements = (projectId) => {
    try {
      const storageKey = `measurements-${projectId}`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('Error fetching measurements:', error);
      return [];
    }
  };

  const getMeasurementSummary = (projectId) => {
    try {
      const measurements = getProjectMeasurements(projectId);
      const summary = {};
      
      measurements.forEach(measurement => {
        const key = `${measurement.trade}_${measurement.unit}`;
        if (!summary[key]) {
          summary[key] = {
            trade: measurement.trade,
            unit: measurement.unit,
            total: 0
          };
        }
        summary[key].total += parseFloat(measurement.result) || 0;
      });
      
      return Object.values(summary);
    } catch (error) {
      console.error('Error getting measurement summary:', error);
      return [];
    }
  };

  // Mock calculation functions
  const addCalculation = async (projectId, calculation) => {
    try {
      const calculationId = `calculation-${Date.now()}`;
      const newCalculation = {
        id: calculationId,
        ...calculation,
        project_id: projectId,
        created_by: currentUser.id,
        created_at: new Date().toISOString()
      };
      
      const storageKey = `calculations-${projectId}`;
      const existingCalculations = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([...existingCalculations, newCalculation]));
      
      return newCalculation;
    } catch (error) {
      console.error('Error adding calculation:', error);
      throw error;
    }
  };

  const getProjectCalculations = (projectId) => {
    try {
      const storageKey = `calculations-${projectId}`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error('Error fetching calculations:', error);
      return [];
    }
  };

  // Function to explicitly load projects - useful for testing
  const loadProjects = () => {
    const savedProjects = localStorage.getItem(`meister-projects-${currentUser?.id}`);
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  };

  const value = {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getProjectMeasurements,
    getMeasurementSummary,
    addCalculation,
    getProjectCalculations,
    loadProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};