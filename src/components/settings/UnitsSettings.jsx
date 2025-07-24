import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } = FiIcons;

const UnitsSettings = () => {
  const { units, addUnit, updateUnit, deleteUnit } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: '' });

  const unitTypes = [
    { value: 'area', label: 'Fläche' },
    { value: 'length', label: 'Länge' },
    { value: 'piece', label: 'Stück' },
    { value: 'weight', label: 'Gewicht' },
    { value: 'time', label: 'Zeit' },
    { value: 'volume', label: 'Volumen' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUnit) {
      updateUnit(editingUnit.id, formData);
    } else {
      addUnit(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', type: '' });
    setShowForm(false);
    setEditingUnit(null);
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name, type: unit.type });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Einheit löschen möchten?')) {
      deleteUnit(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Einheiten verwalten</h2>
          <p className="text-gray-600">Definieren Sie alle benötigten Maßeinheiten</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Neue Einheit</span>
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-4 mb-6"
        >
          <form onSubmit={handleSubmit} className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Einheit-Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. m², mtr, Stück"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wählen...</option>
                {unitTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <SafeIcon icon={FiCheck} className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Einheit</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Typ</th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {units.map((unit, index) => (
              <motion.tr
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-900">{unit.name}</td>
                <td className="py-3 px-4 text-gray-600">
                  {unitTypes.find(t => t.value === unit.type)?.label || unit.type}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(unit)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(unit.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {units.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Keine Einheiten definiert</p>
        </div>
      )}
    </div>
  );
};

export default UnitsSettings;