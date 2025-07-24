import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import Calculator from '../calculator/Calculator';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiCalculator, FiChevronDown, FiCheck } = FiIcons;

const MeasurementModule = () => {
  const { id } = useParams();
  const { projects, addMeasurement, getProjectMeasurements, deleteMeasurement, updateMeasurement } = useProjects();
  const { trades, rooms, floors } = useSettings();
  const [project, setProject] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [lastUsedLocation, setLastUsedLocation] = useState({
    floor: '',
    room: ''
  });
  
  const [formData, setFormData] = useState({
    floor: '',
    room: '',
    trades: [], // Changed to array for multiple selection
    unit: '',
    calculation: '',
    result: '',
    description: ''
  });

  const [showTradeDropdown, setShowTradeDropdown] = useState(false);

  useEffect(() => {
    const currentProject = projects.find(p => p.id === id);
    setProject(currentProject);
    setMeasurements(getProjectMeasurements(id));
    
    // Try to restore last used location from localStorage
    const savedLocation = localStorage.getItem(`meister-lastLocation-${id}`);
    if (savedLocation) {
      setLastUsedLocation(JSON.parse(savedLocation));
    }
  }, [projects, id, getProjectMeasurements]);

  useEffect(() => {
    // When showing the form, pre-fill with last used location or editing data
    if (showForm) {
      if (editingMeasurement) {
        // If editing, populate form with measurement data
        setFormData({
          floor: editingMeasurement.floor,
          room: editingMeasurement.room,
          trades: [editingMeasurement.trade],
          unit: editingMeasurement.unit,
          calculation: editingMeasurement.calculation,
          result: editingMeasurement.result,
          description: editingMeasurement.description || ''
        });
      } else if (lastUsedLocation.floor && lastUsedLocation.room) {
        // If new measurement, use last location
        setFormData(prev => ({
          ...prev,
          floor: lastUsedLocation.floor,
          room: lastUsedLocation.room
        }));
      }
    }
  }, [showForm, lastUsedLocation, editingMeasurement]);

  const handleTradeToggle = (tradeName) => {
    setFormData(prev => {
      const isSelected = prev.trades.includes(tradeName);
      const newTrades = isSelected 
        ? prev.trades.filter(t => t !== tradeName)
        : [...prev.trades, tradeName];
      
      // Update unit based on selected trades
      let unit = '';
      if (newTrades.length === 1) {
        const trade = trades.find(t => t.name === newTrades[0]);
        unit = trade?.unit || '';
      } else if (newTrades.length > 1) {
        // Check if all selected trades have the same unit
        const units = newTrades.map(tradeName => {
          const trade = trades.find(t => t.name === tradeName);
          return trade?.unit || '';
        });
        const uniqueUnits = [...new Set(units)];
        unit = uniqueUnits.length === 1 ? uniqueUnits[0] : 'gemischt';
      }
      
      return {
        ...prev,
        trades: newTrades,
        unit
      };
    });
  };

  const handleCalculatorResult = (calculation, result) => {
    setFormData(prev => ({
      ...prev,
      calculation,
      result: result.toString()
    }));
    setShowCalculator(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingMeasurement) {
      // Update existing measurement
      updateMeasurement(id, editingMeasurement.id, {
        floor: formData.floor,
        room: formData.room,
        trade: formData.trades[0], // When editing, we only allow one trade
        unit: formData.unit,
        calculation: formData.calculation,
        result: formData.result,
        description: formData.description
      });
    } else {
      // Create measurements for each selected trade
      formData.trades.forEach(tradeName => {
        const trade = trades.find(t => t.name === tradeName);
        const measurementData = {
          floor: formData.floor,
          room: formData.room,
          trade: tradeName,
          unit: trade?.unit || formData.unit,
          calculation: formData.calculation,
          result: formData.result,
          description: formData.description
        };
        addMeasurement(id, measurementData);
      });
    }
    
    setMeasurements(getProjectMeasurements(id));
    
    // Save the last used location
    const newLastLocation = {
      floor: formData.floor,
      room: formData.room
    };
    setLastUsedLocation(newLastLocation);
    localStorage.setItem(`meister-lastLocation-${id}`, JSON.stringify(newLastLocation));
    
    // Reset form but preserve the floor and room
    handleCloseForm();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowTradeDropdown(false);
    setEditingMeasurement(null);
    // Reset form data completely when explicitly closing
    setFormData({
      floor: '',
      room: '',
      trades: [],
      unit: '',
      calculation: '',
      result: '',
      description: ''
    });
  };

  const handleEditMeasurement = (measurement) => {
    setEditingMeasurement(measurement);
    setShowForm(true);
  };

  const handleDelete = (measurementId) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Messung löschen möchten?')) {
      deleteMeasurement(id, measurementId);
      setMeasurements(getProjectMeasurements(id));
    }
  };

  const groupedMeasurements = measurements.reduce((groups, measurement) => {
    const key = `${measurement.floor}_${measurement.room}`;
    if (!groups[key]) {
      groups[key] = {
        floor: measurement.floor,
        room: measurement.room,
        measurements: []
      };
    }
    groups[key].measurements.push(measurement);
    return groups;
  }, {});

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
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-8 bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <Link
            to={`/project/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aufmaß</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setEditingMeasurement(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center shadow-sm"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Neue Messung</span>
        </button>
      </div>

      {Object.keys(groupedMeasurements).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <SafeIcon icon={FiCalculator} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Messungen vorhanden</h3>
          <p className="text-gray-600 mb-4">Erfassen Sie Ihre erste Messung, um zu beginnen.</p>
          <button
            onClick={() => {
              setEditingMeasurement(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Messung erfassen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedMeasurements).map((group, groupIndex) => (
            <motion.div
              key={`${group.floor}_${group.room}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  {group.floor} - {group.room}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gewerk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Berechnung
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ergebnis
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschreibung
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.measurements.map((measurement) => (
                      <tr key={measurement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {measurement.trade}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {measurement.calculation}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {measurement.result} {measurement.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {measurement.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditMeasurement(measurement)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                            >
                              <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(measurement.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMeasurement ? 'Messung bearbeiten' : 'Neue Messung'}
              </h2>
              {formData.floor && formData.room && (
                <span className="text-sm text-gray-500">
                  {formData.floor} - {formData.room}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage *
                  </label>
                  <select
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wählen...</option>
                    {floors.map(floor => (
                      <option key={floor.id} value={floor.name}>{floor.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raum *
                  </label>
                  <select
                    required
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wählen...</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.name}>{room.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingMeasurement ? 'Gewerk *' : 'Gewerke * (Mehrfachauswahl möglich)'}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTradeDropdown(!showTradeDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                    disabled={editingMeasurement !== null}
                  >
                    <span className="text-left">
                      {formData.trades.length === 0 
                        ? 'Gewerke auswählen...' 
                        : `${formData.trades.length} Gewerk(e) ausgewählt`
                      }
                    </span>
                    <SafeIcon icon={FiChevronDown} className={`w-4 h-4 transition-transform ${showTradeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showTradeDropdown && !editingMeasurement && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {trades.map(trade => (
                        <label
                          key={trade.id}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.trades.includes(trade.name)}
                            onChange={() => handleTradeToggle(trade.name)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{trade.name}</span>
                          <span className="text-xs text-gray-500 ml-auto">({trade.unit})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                
                {formData.trades.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.trades.map(tradeName => (
                      <span
                        key={tradeName}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tradeName}
                        {!editingMeasurement && (
                          <button
                            type="button"
                            onClick={() => handleTradeToggle(tradeName)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berechnung *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={formData.calculation}
                    onChange={(e) => setFormData(prev => ({ ...prev, calculation: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. (3.5 * 2.4) + (2.8 * 1.5)"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalculator(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <SafeIcon icon={FiCalculator} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ergebnis *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.result}
                    onChange={(e) => setFormData(prev => ({ ...prev, result: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Einheit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optionale Beschreibung..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={formData.trades.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {editingMeasurement ? 'Aktualisieren' : 'Speichern & Weiter'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showCalculator && (
        <Calculator
          onResult={handleCalculatorResult}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
};

export default MeasurementModule;