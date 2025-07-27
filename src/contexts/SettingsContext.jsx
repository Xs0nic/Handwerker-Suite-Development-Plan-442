import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [trades, setTrades] = useState([]);
  const [units, setUnits] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [employees, setEmployees] = useState([]);
  const { currentUser, currentCompany } = useAuth();

  // Initialize with demo data
  useEffect(() => {
    if (currentUser && currentCompany) {
      // Default trades
      const defaultTrades = [
        { id: 'trade-1', name: 'Malerarbeiten', unit: 'm²', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'trade-2', name: 'Fliesenarbeiten', unit: 'm²', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'trade-3', name: 'Bodenbeläge', unit: 'm²', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'trade-4', name: 'Elektroarbeiten', unit: 'Stk', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'trade-5', name: 'Sanitärarbeiten', unit: 'Stk', company_id: currentCompany.id, created_at: new Date().toISOString() }
      ];
      
      // Default units
      const defaultUnits = [
        { id: 'unit-1', name: 'm²', type: 'area', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'unit-2', name: 'mtr', type: 'length', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'unit-3', name: 'Stk', type: 'piece', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'unit-4', name: 'kg', type: 'weight', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'unit-5', name: 'l', type: 'volume', company_id: currentCompany.id, created_at: new Date().toISOString() }
      ];
      
      // Default rooms
      const defaultRooms = [
        { id: 'room-1', name: 'Wohnzimmer', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'room-2', name: 'Küche', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'room-3', name: 'Badezimmer', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'room-4', name: 'Schlafzimmer', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'room-5', name: 'Flur', company_id: currentCompany.id, created_at: new Date().toISOString() }
      ];
      
      // Default floors
      const defaultFloors = [
        { id: 'floor-1', name: 'Keller', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'floor-2', name: 'Erdgeschoss', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'floor-3', name: '1. OG', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'floor-4', name: '2. OG', company_id: currentCompany.id, created_at: new Date().toISOString() },
        { id: 'floor-5', name: 'Dachgeschoss', company_id: currentCompany.id, created_at: new Date().toISOString() }
      ];
      
      // Default materials
      const defaultMaterials = [
        { 
          id: 'material-1', 
          name: 'Wandfarbe weiß', 
          unit: 'l', 
          packageSize: 10, 
          calculationType: 'area', 
          consumption: 0.25, 
          consumptionUnit: 'l/m²', 
          company_id: currentCompany.id, 
          created_at: new Date().toISOString() 
        },
        { 
          id: 'material-2', 
          name: 'Bodenfliesen grau', 
          unit: 'm²', 
          packageSize: 1.5, 
          calculationType: 'area', 
          consumption: 1.05, 
          consumptionUnit: 'm²/m²', 
          company_id: currentCompany.id, 
          created_at: new Date().toISOString() 
        },
        { 
          id: 'material-3', 
          name: 'Laminat Eiche', 
          unit: 'm²', 
          packageSize: 2.5, 
          calculationType: 'area', 
          consumption: 1.1, 
          consumptionUnit: 'm²/m²', 
          company_id: currentCompany.id, 
          created_at: new Date().toISOString() 
        }
      ];
      
      // Default employees
      const defaultEmployees = [
        { 
          id: 'employee-1', 
          name: 'Max Mustermann', 
          role: 'Maler', 
          email: 'max@example.com', 
          phone: '+49 123 456789', 
          company_id: currentCompany.id, 
          created_at: new Date().toISOString() 
        },
        { 
          id: 'employee-2', 
          name: 'Anna Schmidt', 
          role: 'Fliesenleger', 
          email: 'anna@example.com', 
          phone: '+49 987 654321', 
          company_id: currentCompany.id, 
          created_at: new Date().toISOString() 
        }
      ];
      
      setTrades(defaultTrades);
      setUnits(defaultUnits);
      setRooms(defaultRooms);
      setFloors(defaultFloors);
      setMaterials(defaultMaterials);
      setEmployees(defaultEmployees);
    }
  }, [currentUser, currentCompany]);

  // Generic CRUD operations for all entity types
  const createEntity = (collection, setCollection, entity) => {
    const newEntity = {
      id: `${collection}-${Date.now()}`,
      ...entity,
      company_id: currentCompany.id,
      created_at: new Date().toISOString()
    };
    
    setCollection(prev => [newEntity, ...prev]);
    return newEntity;
  };
  
  const updateEntity = (collection, setCollection, id, updates) => {
    setCollection(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };
  
  const deleteEntity = (collection, setCollection, id) => {
    setCollection(prev => prev.filter(item => item.id !== id));
  };

  // Trades operations
  const addTrade = (trade) => createEntity('trade', setTrades, trade);
  const updateTrade = (id, updates) => updateEntity('trade', setTrades, id, updates);
  const deleteTrade = (id) => deleteEntity('trade', setTrades, id);

  // Units operations
  const addUnit = (unit) => createEntity('unit', setUnits, unit);
  const updateUnit = (id, updates) => updateEntity('unit', setUnits, id, updates);
  const deleteUnit = (id) => deleteEntity('unit', setUnits, id);

  // Rooms operations
  const addRoom = (room) => createEntity('room', setRooms, room);
  const updateRoom = (id, updates) => updateEntity('room', setRooms, id, updates);
  const deleteRoom = (id) => deleteEntity('room', setRooms, id);

  // Floors operations
  const addFloor = (floor) => createEntity('floor', setFloors, floor);
  const updateFloor = (id, updates) => updateEntity('floor', setFloors, id, updates);
  const deleteFloor = (id) => deleteEntity('floor', setFloors, id);

  // Materials operations
  const addMaterial = (material) => createEntity('material', setMaterials, material);
  const updateMaterial = (id, updates) => updateEntity('material', setMaterials, id, updates);
  const deleteMaterial = (id) => deleteEntity('material', setMaterials, id);

  // Employees operations
  const addEmployee = (employee) => createEntity('employee', setEmployees, employee);
  const updateEmployee = (id, updates) => updateEntity('employee', setEmployees, id, updates);
  const deleteEmployee = (id) => deleteEntity('employee', setEmployees, id);

  // Helper function to get materials for a specific trade
  const getMaterialsForTrade = (trade, unit) => {
    const tradeUnit = unit || trades.find(t => t.name === trade)?.unit;
    return materials.filter(material => {
      return material.consumptionUnit?.includes(tradeUnit);
    });
  };

  const value = {
    trades,
    units,
    rooms,
    floors,
    materials,
    employees,
    addTrade,
    updateTrade,
    deleteTrade,
    addUnit,
    updateUnit,
    deleteUnit,
    addRoom,
    updateRoom,
    deleteRoom,
    addFloor,
    updateFloor,
    deleteFloor,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getMaterialsForTrade,
    loadAllSettings: () => {} // Dummy function for compatibility
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};