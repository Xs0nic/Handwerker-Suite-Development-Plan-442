import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [measurements, setMeasurements] = useState({});
  const [calculations, setCalculations] = useState({});

  useEffect(() => {
    const savedProjects = localStorage.getItem('meister-projects');
    const savedMeasurements = localStorage.getItem('meister-measurements');
    const savedCalculations = localStorage.getItem('meister-calculations');

    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
    if (savedMeasurements) {
      setMeasurements(JSON.parse(savedMeasurements));
    }
    if (savedCalculations) {
      setCalculations(JSON.parse(savedCalculations));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('meister-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('meister-measurements', JSON.stringify(measurements));
  }, [measurements]);

  useEffect(() => {
    localStorage.setItem('meister-calculations', JSON.stringify(calculations));
  }, [calculations]);

  const createProject = (projectData) => {
    const newProject = {
      id: Date.now().toString(),
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id, updates) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === id 
          ? { ...project, ...updates, updatedAt: new Date().toISOString() } 
          : project
      )
    );
  };

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    
    const newMeasurements = { ...measurements };
    delete newMeasurements[id];
    setMeasurements(newMeasurements);
    
    const newCalculations = { ...calculations };
    delete newCalculations[id];
    setCalculations(newCalculations);
  };

  const addMeasurement = (projectId, measurement) => {
    setMeasurements(prev => ({
      ...prev,
      [projectId]: [
        ...(prev[projectId] || []),
        {
          id: Date.now().toString(),
          ...measurement,
          createdAt: new Date().toISOString()
        }
      ]
    }));
  };

  const updateMeasurement = (projectId, measurementId, updates) => {
    setMeasurements(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).map(m => 
        m.id === measurementId 
          ? { ...m, ...updates, updatedAt: new Date().toISOString() } 
          : m
      )
    }));
  };

  const deleteMeasurement = (projectId, measurementId) => {
    setMeasurements(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(m => m.id !== measurementId)
    }));
  };

  const getProjectMeasurements = (projectId) => {
    return measurements[projectId] || [];
  };

  const getMeasurementSummary = (projectId) => {
    const projectMeasurements = measurements[projectId] || [];
    const summary = {};

    projectMeasurements.forEach(measurement => {
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
  };

  const addCalculation = (projectId, calculation) => {
    setCalculations(prev => ({
      ...prev,
      [projectId]: [
        ...(prev[projectId] || []),
        {
          id: Date.now().toString(),
          ...calculation,
          createdAt: new Date().toISOString()
        }
      ]
    }));
  };

  const getProjectCalculations = (projectId) => {
    return calculations[projectId] || [];
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
    getProjectCalculations
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};