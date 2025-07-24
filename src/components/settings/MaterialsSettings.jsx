import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } = FiIcons;

const MaterialsSettings = () => {
  const { materials, units, addMaterial, updateMaterial, deleteMaterial } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    packageSize: '',
    calculationType: '',
    consumption: '',
    consumptionUnit: ''
  });

  const calculationTypes = [
    { value: 'area', label: 'Flächenbasiert (pro m²)' },
    { value: 'length', label: 'Längenbasiert (pro mtr)' },
    { value: 'piece', label: 'Stückbasiert' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const materialData = {
      ...formData,
      packageSize: parseFloat(formData.packageSize),
      consumption: parseFloat(formData.consumption)
    };
    
    if (editingMaterial) {
      updateMaterial(editingMaterial.id, materialData);
    } else {
      addMaterial(materialData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      packageSize: '',
      calculationType: '',
      consumption: '',
      consumptionUnit: ''
    });
    setShowForm(false);
    setEditingMaterial(null);
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      unit: material.unit,
      packageSize: material.packageSize.toString(),
      calculationType: material.calculationType,
      consumption: material.consumption.toString(),
      consumptionUnit: material.consumptionUnit
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Material löschen möchten?')) {
      deleteMaterial(id);
    }
  };

  const handleCalculationTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      calculationType: type,
      consumptionUnit: type === 'area' ? `${prev.unit}/m²` : 
                      type === 'length' ? `${prev.unit}/mtr` : 
                      `${prev.unit}/Stück`
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Materialien verwalten</h2>
          <p className="text-gray-600">Verwalten Sie Ihre Produktliste mit Verbrauchswerten</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Neues Material</span>
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6 mb-6"
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material-Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Knauf Rotband Putz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Einheit
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wählen...</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.name}>{unit.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gebindegröße
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.packageSize}
                onChange={(e) => setFormData(prev => ({ ...prev, packageSize: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. 25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Berechnungstyp
              </label>
              <select
                required
                value={formData.calculationType}
                onChange={(e) => handleCalculationTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wählen...</option>
                {calculationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verbrauch
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.consumption}
                onChange={(e) => setFormData(prev => ({ ...prev, consumption: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. 10"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
                <span>Abbrechen</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiCheck} className="w-4 h-4" />
                <span>{editingMaterial ? 'Aktualisieren' : 'Hinzufügen'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Material</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Gebinde</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Verbrauch</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Typ</th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {materials.map((material, index) => (
              <motion.tr
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-900">{material.name}</td>
                <td className="py-3 px-4 text-gray-600">
                  {material.packageSize} {material.unit}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {material.consumption} {material.consumptionUnit}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {calculationTypes.find(t => t.value === material.calculationType)?.label || material.calculationType}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(material)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
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

      {materials.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Keine Materialien definiert</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsSettings;