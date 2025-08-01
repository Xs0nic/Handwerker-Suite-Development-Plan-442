import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } = FiIcons;

const FloorsSettings = () => {
  const { floors, addFloor, updateFloor, deleteFloor } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFloor) {
      updateFloor(editingFloor.id, formData);
    } else {
      addFloor(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setShowForm(false);
    setEditingFloor(null);
  };

  const handleEdit = (floor) => {
    setEditingFloor(floor);
    setFormData({ name: floor.name });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Etage löschen möchten?')) {
      deleteFloor(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Etagen verwalten</h2>
          <p className="text-gray-600">Definieren Sie wiederkehrende Etagenbezeichnungen</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Neue Etage</span>
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
                Etagen-Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Erdgeschoss, 1. OG, Keller"
              />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floors.map((floor, index) => (
          <motion.div
            key={floor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{floor.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(floor)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                >
                  <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(floor.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {floors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Keine Etagen definiert</p>
        </div>
      )}
    </div>
  );
};

export default FloorsSettings;