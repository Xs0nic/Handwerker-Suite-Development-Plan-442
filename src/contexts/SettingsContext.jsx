import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const defaultTrades = [
  { id: '1', name: 'Verputzen', unit: 'm²' },
  { id: '2', name: 'Fliesen legen', unit: 'm²' },
  { id: '3', name: 'Malen', unit: 'm²' },
  { id: '4', name: 'Silikonfuge', unit: 'mtr' },
  { id: '5', name: 'Grundieren', unit: 'm²' }
];

const defaultUnits = [
  { id: '1', name: 'm²', type: 'area' },
  { id: '2', name: 'mtr', type: 'length' },
  { id: '3', name: 'Stück', type: 'piece' },
  { id: '4', name: 'kg', type: 'weight' },
  { id: '5', name: 'Stunde', type: 'time' }
];

const defaultRooms = [
  { id: '1', name: 'Wohnzimmer' },
  { id: '2', name: 'Küche' },
  { id: '3', name: 'Bad' },
  { id: '4', name: 'Schlafzimmer' },
  { id: '5', name: 'Flur' }
];

const defaultFloors = [
  { id: '1', name: 'Erdgeschoss' },
  { id: '2', name: '1. Obergeschoss' },
  { id: '3', name: 'Keller' },
  { id: '4', name: 'Dachgeschoss' }
];

const defaultMaterials = [
  {
    id: '1',
    name: 'Knauf Rotband Putz',
    unit: 'kg',
    packageSize: 30,
    calculationType: 'area',
    consumption: 10,
    consumptionUnit: 'kg/m²'
  },
  {
    id: '2',
    name: 'PCI Tiefengrund',
    unit: 'l',
    packageSize: 10,
    calculationType: 'area',
    consumption: 0.15,
    consumptionUnit: 'l/m²'
  }
];

const defaultEmployees = [
  {
    id: '1',
    name: 'Max Mustermann',
    role: 'Fliesenleger',
    email: 'max@beispiel.de',
    phone: '+49 123 456789'
  },
  {
    id: '2',
    name: 'Anna Schmidt',
    role: 'Malerin',
    email: 'anna@beispiel.de',
    phone: '+49 987 654321'
  }
];

export const SettingsProvider = ({ children }) => {
  const [trades, setTrades] = useState(defaultTrades);
  const [units, setUnits] = useState(defaultUnits);
  const [rooms, setRooms] = useState(defaultRooms);
  const [floors, setFloors] = useState(defaultFloors);
  const [materials, setMaterials] = useState(defaultMaterials);
  const [employees, setEmployees] = useState(defaultEmployees);

  useEffect(() => {
    const savedTrades = localStorage.getItem('meister-trades');
    const savedUnits = localStorage.getItem('meister-units');
    const savedRooms = localStorage.getItem('meister-rooms');
    const savedFloors = localStorage.getItem('meister-floors');
    const savedMaterials = localStorage.getItem('meister-materials');
    const savedEmployees = localStorage.getItem('meister-employees');

    if (savedTrades) setTrades(JSON.parse(savedTrades));
    if (savedUnits) setUnits(JSON.parse(savedUnits));
    if (savedRooms) setRooms(JSON.parse(savedRooms));
    if (savedFloors) setFloors(JSON.parse(savedFloors));
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
  }, []);

  useEffect(() => {
    localStorage.setItem('meister-trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('meister-units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('meister-rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('meister-floors', JSON.stringify(floors));
  }, [floors]);

  useEffect(() => {
    localStorage.setItem('meister-materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('meister-employees', JSON.stringify(employees));
  }, [employees]);

  // Trade functions
  const addTrade = (trade) => {
    setTrades(prev => [...prev, { ...trade, id: Date.now().toString() }]);
  };

  const updateTrade = (id, updates) => {
    setTrades(prev => prev.map(trade => 
      trade.id === id ? { ...trade, ...updates } : trade
    ));
  };

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(trade => trade.id !== id));
  };

  // Unit functions
  const addUnit = (unit) => {
    setUnits(prev => [...prev, { ...unit, id: Date.now().toString() }]);
  };

  const updateUnit = (id, updates) => {
    setUnits(prev => prev.map(unit => 
      unit.id === id ? { ...unit, ...updates } : unit
    ));
  };

  const deleteUnit = (id) => {
    setUnits(prev => prev.filter(unit => unit.id !== id));
  };

  // Room functions
  const addRoom = (room) => {
    setRooms(prev => [...prev, { ...room, id: Date.now().toString() }]);
  };

  const updateRoom = (id, updates) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, ...updates } : room
    ));
  };

  const deleteRoom = (id) => {
    setRooms(prev => prev.filter(room => room.id !== id));
  };

  // Floor functions
  const addFloor = (floor) => {
    setFloors(prev => [...prev, { ...floor, id: Date.now().toString() }]);
  };

  const updateFloor = (id, updates) => {
    setFloors(prev => prev.map(floor => 
      floor.id === id ? { ...floor, ...updates } : floor
    ));
  };

  const deleteFloor = (id) => {
    setFloors(prev => prev.filter(floor => floor.id !== id));
  };

  // Material functions
  const addMaterial = (material) => {
    setMaterials(prev => [...prev, { ...material, id: Date.now().toString() }]);
  };

  const updateMaterial = (id, updates) => {
    setMaterials(prev => prev.map(material => 
      material.id === id ? { ...material, ...updates } : material
    ));
  };

  const deleteMaterial = (id) => {
    setMaterials(prev => prev.filter(material => material.id !== id));
  };

  // Employee functions
  const addEmployee = (employee) => {
    setEmployees(prev => [...prev, { ...employee, id: Date.now().toString() }]);
  };

  const updateEmployee = (id, updates) => {
    setEmployees(prev => prev.map(employee => 
      employee.id === id ? { ...employee, ...updates } : employee
    ));
  };

  const deleteEmployee = (id) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id));
  };

  const getMaterialsForTrade = (trade, unit) => {
    return materials.filter(material => {
      const tradeUnit = unit || trades.find(t => t.name === trade)?.unit;
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
    getMaterialsForTrade
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};