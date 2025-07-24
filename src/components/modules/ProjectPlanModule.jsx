import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiArrowLeft, 
  FiPlus, 
  FiCalendar, 
  FiUser, 
  FiEdit2, 
  FiTrash2, 
  FiClock,
  FiMapPin,
  FiCheck,
  FiX,
  FiUsers,
  FiMoreVertical
} = FiIcons;

const ProjectPlanModule = () => {
  const { id } = useParams();
  const { projects, updateProject } = useProjects();
  const { employees, addEmployee } = useSettings();
  const [project, setProject] = useState(null);
  const [planItems, setPlanItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '17:00',
    assignedEmployees: [],
    status: 'geplant',
    priority: 'normal',
    location: '',
    notes: ''
  });

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    email: '',
    phone: ''
  });

  const statusOptions = [
    { value: 'geplant', label: 'Geplant', color: 'blue' },
    { value: 'in_progress', label: 'In Bearbeitung', color: 'yellow' },
    { value: 'completed', label: 'Abgeschlossen', color: 'green' },
    { value: 'cancelled', label: 'Abgebrochen', color: 'red' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Niedrig', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'high', label: 'Hoch', color: 'orange' },
    { value: 'urgent', label: 'Dringend', color: 'red' }
  ];

  useEffect(() => {
    const currentProject = projects.find(p => p.id === id);
    setProject(currentProject);
    setPlanItems(currentProject?.planItems || []);
  }, [projects, id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const planItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      ...formData,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedPlanItems;
    if (editingItem) {
      updatedPlanItems = planItems.map(item => 
        item.id === editingItem.id ? planItem : item
      );
    } else {
      updatedPlanItems = [...planItems, planItem];
    }

    setPlanItems(updatedPlanItems);
    updateProject(id, { planItems: updatedPlanItems });
    resetForm();
  };

  const handleEmployeeSubmit = (e) => {
    e.preventDefault();
    addEmployee(newEmployee);
    setNewEmployee({ name: '', role: '', email: '', phone: '' });
    setShowEmployeeForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '08:00',
      endTime: '17:00',
      assignedEmployees: [],
      status: 'geplant',
      priority: 'normal',
      location: '',
      notes: ''
    });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
    setDropdownOpen(null);
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Planungseintrag löschen möchten?')) {
      const updatedPlanItems = planItems.filter(item => item.id !== itemId);
      setPlanItems(updatedPlanItems);
      updateProject(id, { planItems: updatedPlanItems });
    }
    setDropdownOpen(null);
  };

  const handleEmployeeToggle = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employeeId)
        ? prev.assignedEmployees.filter(id => id !== employeeId)
        : [...prev.assignedEmployees, employeeId]
    }));
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'gray';
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'gray';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Unbekannt';
  };

  const sortedPlanItems = [...planItems].sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateA - dateB;
  });

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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to={`/project/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projektplanung</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowEmployeeForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <SafeIcon icon={FiUser} className="w-4 h-4" />
            <span>Mitarbeiter</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>Termin planen</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {statusOptions.map(status => {
          const count = planItems.filter(item => item.status === status.value).length;
          return (
            <div key={status.value} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`w-3 h-3 rounded-full bg-${status.color}-500`}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Geplante Termine</h2>
        </div>
        
        {sortedPlanItems.length === 0 ? (
          <div className="text-center py-12">
            <SafeIcon icon={FiCalendar} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Termine geplant</h3>
            <p className="text-gray-600 mb-4">Erstellen Sie Ihren ersten Planungseintrag</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Termin planen
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedPlanItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(item.status)}-100 text-${getStatusColor(item.status)}-800`}>
                        {statusOptions.find(opt => opt.value === item.status)?.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getPriorityColor(item.priority)}-100 text-${getPriorityColor(item.priority)}-800`}>
                        {priorityOptions.find(opt => opt.value === item.priority)?.label}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-600 mb-3">{item.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                        <span>
                          {formatDate(item.startDate)}
                          {item.endDate && item.endDate !== item.startDate && (
                            <> - {formatDate(item.endDate)}</>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-600">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                      </div>
                      
                      {item.location && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {item.assignedEmployees.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <SafeIcon icon={FiUsers} className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {item.assignedEmployees.map(employeeId => (
                            <span
                              key={employeeId}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {getEmployeeName(employeeId)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative ml-4">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <SafeIcon icon={FiMoreVertical} className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {dropdownOpen === item.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                          <span>Bearbeiten</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                          <span>Löschen</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Termin bearbeiten' : 'Neuen Termin planen'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Badezimmer renovieren"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Detaillierte Beschreibung der Arbeiten..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startdatum *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startzeit
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorität
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standort
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Arbeitsort oder Adresse"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zugewiesene Mitarbeiter
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {employees.length === 0 ? (
                    <p className="text-gray-500 text-sm">Keine Mitarbeiter verfügbar</p>
                  ) : (
                    <div className="space-y-2">
                      {employees.map(employee => (
                        <label key={employee.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assignedEmployees.includes(employee.id)}
                            onChange={() => handleEmployeeToggle(employee.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {employee.name} {employee.role && `(${employee.role})`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Zusätzliche Informationen oder Hinweise..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Aktualisieren' : 'Speichern'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Neuen Mitarbeiter hinzufügen</h2>
            </div>
            
            <form onSubmit={handleEmployeeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Vollständiger Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position/Rolle
                </label>
                <input
                  type="text"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Fliesenleger, Maler"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@beispiel.de"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+49 123 456789"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmployeeForm(false);
                    setNewEmployee({ name: '', role: '', email: '', phone: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectPlanModule;