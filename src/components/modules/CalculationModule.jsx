import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiArrowLeft, FiPackage, FiDownload, FiShoppingCart } = FiIcons;

const CalculationModule = () => {
  const { id } = useParams();
  const { projects, getMeasurementSummary, addCalculation, getProjectCalculations } = useProjects();
  const { getMaterialsForTrade } = useSettings();
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState([]);
  const [calculations, setCalculations] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState({});

  useEffect(() => {
    const currentProject = projects.find(p => p.id === id);
    setProject(currentProject);
    setSummary(getMeasurementSummary(id));
    setCalculations(getProjectCalculations(id));
  }, [projects, id, getMeasurementSummary, getProjectCalculations]);

  const handleMaterialSelection = (summaryItem, material) => {
    const consumption = parseFloat(material.consumption);
    const totalAmount = summaryItem.total * consumption;
    const packages = Math.ceil(totalAmount / material.packageSize);

    const calculation = {
      trade: summaryItem.trade,
      unit: summaryItem.unit,
      quantity: summaryItem.total,
      material: material.name,
      consumption: material.consumption,
      consumptionUnit: material.consumptionUnit,
      totalAmount: Math.round(totalAmount * 100) / 100,
      packages: packages,
      packageSize: material.packageSize,
      materialUnit: material.unit
    };

    addCalculation(id, calculation);
    setCalculations(getProjectCalculations(id));
    
    setSelectedMaterials(prev => ({
      ...prev,
      [`${summaryItem.trade}_${summaryItem.unit}`]: material
    }));
  };

  const generateShoppingList = () => {
    const list = calculations.map(calc => ({
      material: calc.material,
      packages: calc.packages,
      packageSize: calc.packageSize,
      unit: calc.materialUnit,
      totalAmount: calc.totalAmount,
      forTrade: calc.trade
    }));

    return list;
  };

  const exportToPDF = () => {
    const shoppingList = generateShoppingList();
    let content = `Einkaufsliste - ${project?.name}\n`;
    content += `Kunde: ${project?.customer}\n\n`;
    
    shoppingList.forEach(item => {
      content += `${item.material}\n`;
      content += `  Menge: ${item.packages} x ${item.packageSize} ${item.unit}\n`;
      content += `  Gesamt: ${item.totalAmount} ${item.unit}\n`;
      content += `  Für: ${item.forTrade}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Einkaufsliste_${project?.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const shoppingList = generateShoppingList();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to={`/project/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kalkulation</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        
        {shoppingList.length > 0 && (
          <button
            onClick={exportToPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            <span>Liste exportieren</span>
          </button>
        )}
      </div>

      {summary.length === 0 ? (
        <div className="text-center py-12">
          <SafeIcon icon={FiPackage} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Aufmaß-Daten vorhanden</h3>
          <p className="text-gray-600 mb-4">Erfassen Sie zuerst Messungen im Aufmaß-Modul.</p>
          <Link
            to={`/project/${id}/measurement`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Zum Aufmaß
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Measurement Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aufmaß-Zusammenfassung</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {summary.map((item, index) => (
                <motion.div
                  key={`${item.trade}_${item.unit}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.trade}</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {item.total.toFixed(2)} {item.unit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Material auswählen:
                    </label>
                    <select
                      onChange={(e) => {
                        const materials = getMaterialsForTrade(item.trade, item.unit);
                        const material = materials.find(m => m.id === e.target.value);
                        if (material) {
                          handleMaterialSelection(item, material);
                        }
                      }}
                      value={selectedMaterials[`${item.trade}_${item.unit}`]?.id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Material wählen...</option>
                      {getMaterialsForTrade(item.trade, item.unit).map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.consumption} {material.consumptionUnit})
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Shopping List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <SafeIcon icon={FiShoppingCart} className="w-5 h-5" />
                <span>Einkaufsliste</span>
              </h2>
            </div>
            
            <div className="p-6">
              {shoppingList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <SafeIcon icon={FiPackage} className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Keine Materialien berechnet</p>
                  <p className="text-sm">Wählen Sie Materialien aus der Liste links</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shoppingList.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-medium text-gray-900 mb-2">{item.material}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Gebinde:</span>
                          <p className="font-semibold">
                            {item.packages} x {item.packageSize} {item.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Gesamt:</span>
                          <p className="font-semibold">
                            {item.totalAmount} {item.unit}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Für: {item.forTrade}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationModule;