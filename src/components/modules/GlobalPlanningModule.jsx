import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ReactECharts from 'echarts-for-react';
import { format, parseISO, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

const { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiFilter, 
  FiSearch, 
  FiGrid, 
  FiList,
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiActivity,
  FiLayers,
  FiCheck
} = FiIcons;

const GlobalPlanningModule = () => {
  const { projects } = useProjects();
  const { employees } = useSettings();
  
  const [view, setView] = useState('calendar'); // 'calendar', 'gantt', 'list'
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});

  // Sammle alle Planungselemente aus allen Projekten
  const allPlanItems = projects.flatMap(project => {
    const planItems = project.planItems || [];
    return planItems.map(item => ({
      ...item,
      projectId: project.id,
      projectName: project.name
    }));
  });

  const toggleProjectExpand = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Filtere die Planungselemente
  const getFilteredPlanItems = () => {
    let filtered = [...allPlanItems];

    // Nach Text filtern
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.projectName.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Nach Mitarbeiter filtern
    if (employeeFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.assignedEmployees?.includes(employeeFilter)
      );
    }

    // Nach Status filtern
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Nach Zeitraum filtern
    const today = new Date();
    
    switch (filter) {
      case 'today':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.startDate);
          return isToday(itemDate);
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.startDate);
          return isTomorrow(itemDate);
        });
        break;
      case 'week':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.startDate);
          return isWithinInterval(itemDate, { start: weekStart, end: weekEnd });
        });
        break;
      case 'month':
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.startDate);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });
        break;
    }

    return filtered;
  };

  // Gruppiere Planungselemente nach Projekten für die Listen- und Kalenderansicht
  const getPlanItemsByProject = () => {
    const filteredItems = getFilteredPlanItems();
    const groupedItems = {};
    
    filteredItems.forEach(item => {
      if (!groupedItems[item.projectId]) {
        const project = projects.find(p => p.id === item.projectId);
        groupedItems[item.projectId] = {
          project,
          items: []
        };
      }
      groupedItems[item.projectId].items.push(item);
    });
    
    return groupedItems;
  };

  // Gruppiere Planungselemente nach Datum für die Kalenderansicht
  const getPlanItemsByDate = () => {
    const filteredItems = getFilteredPlanItems();
    const groupedItems = {};
    
    filteredItems.forEach(item => {
      const dateKey = item.startDate;
      if (!groupedItems[dateKey]) {
        groupedItems[dateKey] = [];
      }
      groupedItems[dateKey].push(item);
    });
    
    // Sortiere die Daten
    const sortedDates = Object.keys(groupedItems).sort();
    const result = {};
    
    sortedDates.forEach(date => {
      result[date] = groupedItems[date];
    });
    
    return result;
  };

  // Formatiere Datum für die Anzeige
  const formatDateDisplay = (dateStr) => {
    const date = parseISO(dateStr);
    
    if (isToday(date)) {
      return `Heute, ${format(date, 'dd.MM.yyyy')}`;
    } else if (isTomorrow(date)) {
      return `Morgen, ${format(date, 'dd.MM.yyyy')}`;
    } else {
      return format(date, 'EEEE, dd.MM.yyyy', { locale: de });
    }
  };

  // Status-Farbe
  const getStatusColor = (status) => {
    switch (status) {
      case 'geplant': return 'blue';
      case 'in_progress': return 'yellow';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Prioritäts-Farbe
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'gray';
      case 'normal': return 'blue';
      case 'high': return 'orange';
      case 'urgent': return 'red';
      default: return 'blue';
    }
  };

  // Erstelle Daten für das Gantt-Diagramm
  const getGanttData = () => {
    const filteredItems = getFilteredPlanItems();
    
    // Sortiere nach Startdatum
    filteredItems.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Erstelle ein Set mit allen Projektnamen für die Y-Achse
    const projectNames = Array.from(new Set(filteredItems.map(item => item.projectName)));
    
    // Erstelle die Datenreihen für das Diagramm
    const series = [];
    
    // Gruppe nach Status für verschiedene Farben
    const statusGroups = {
      'geplant': [],
      'in_progress': [],
      'completed': [],
      'cancelled': []
    };
    
    filteredItems.forEach(item => {
      const startDate = new Date(item.startDate);
      const endDate = item.endDate ? new Date(item.endDate) : addDays(startDate, 1);
      
      const dataPoint = {
        name: item.title,
        value: [
          projectNames.indexOf(item.projectName),
          startDate.getTime(),
          endDate.getTime(),
          item
        ]
      };
      
      if (statusGroups[item.status]) {
        statusGroups[item.status].push(dataPoint);
      } else {
        statusGroups['geplant'].push(dataPoint);
      }
    });
    
    // Erstelle eine Serie für jeden Status
    Object.entries(statusGroups).forEach(([status, data]) => {
      if (data.length > 0) {
        series.push({
          name: status,
          type: 'bar',
          stack: 'total',
          itemStyle: {
            color: status === 'geplant' ? '#3b82f6' : 
                   status === 'in_progress' ? '#eab308' : 
                   status === 'completed' ? '#22c55e' : 
                   '#ef4444'
          },
          data
        });
      }
    });
    
    return {
      projectNames,
      series
    };
  };

  // Option für das Gantt-Diagramm
  const getGanttOption = () => {
    const { projectNames, series } = getGanttData();

    return {
      tooltip: {
        formatter: function(params) {
          const item = params.data.value[3];
          const startDate = format(new Date(item.startDate), 'dd.MM.yyyy');
          const endDate = item.endDate ? format(new Date(item.endDate), 'dd.MM.yyyy') : startDate;
          
          let assignedEmployeeNames = '';
          if (item.assignedEmployees && item.assignedEmployees.length > 0) {
            assignedEmployeeNames = item.assignedEmployees.map(id => {
              const emp = employees.find(e => e.id === id);
              return emp ? emp.name : 'Unbekannt';
            }).join(', ');
          }
          
          return `
            <strong>${item.title}</strong><br/>
            Projekt: ${item.projectName}<br/>
            Zeitraum: ${startDate} - ${endDate}<br/>
            Status: ${item.status}<br/>
            ${assignedEmployeeNames ? `Mitarbeiter: ${assignedEmployeeNames}<br/>` : ''}
            ${item.description ? `Beschreibung: ${item.description}` : ''}
          `;
        }
      },
      legend: {
        data: ['geplant', 'in_progress', 'completed', 'cancelled']
      },
      grid: {
        height: 300,
        right: '5%',
        left: '5%',
        bottom: 60,
        containLabel: true
      },
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'weakFilter',
          height: 20,
          bottom: 10,
          start: 0,
          end: 100,
          handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%'
        },
        {
          type: 'inside',
          id: 'insideX',
          xAxisIndex: 0,
          filterMode: 'weakFilter',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true
        }
      ],
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: function(value) {
            return format(new Date(value), 'dd.MM');
          }
        }
      },
      yAxis: {
        type: 'category',
        data: projectNames,
        axisLabel: {
          formatter: function(value) {
            // Gekürzte Anzeige wenn der Name zu lang ist
            return value.length > 20 ? value.substring(0, 20) + '...' : value;
          }
        }
      },
      series
    };
  };

  // Statusfilter-Optionen
  const statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'geplant', label: 'Geplant' },
    { value: 'in_progress', label: 'In Bearbeitung' },
    { value: 'completed', label: 'Abgeschlossen' },
    { value: 'cancelled', label: 'Abgebrochen' }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Globale Projektplanung</h1>
        <p className="text-gray-600">Übersicht aller Termine und Planungen in allen Projekten</p>
      </div>

      {/* Steuerungselemente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Ansicht wählen */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setView('calendar')} 
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 ${view === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
            >
              <SafeIcon icon={FiCalendar} className="w-4 h-4" />
              <span className="text-sm font-medium">Kalender</span>
            </button>
            <button 
              onClick={() => setView('gantt')} 
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 ${view === 'gantt' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
            >
              <SafeIcon icon={FiLayers} className="w-4 h-4" />
              <span className="text-sm font-medium">Gantt</span>
            </button>
            <button 
              onClick={() => setView('list')} 
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
            >
              <SafeIcon icon={FiList} className="w-4 h-4" />
              <span className="text-sm font-medium">Liste</span>
            </button>
          </div>

          {/* Suchfeld */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SafeIcon icon={FiSearch} className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Termine suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Zeitfilter */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Alle
            </button>
            <button 
              onClick={() => setFilter('today')} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === 'today' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Heute
            </button>
            <button 
              onClick={() => setFilter('tomorrow')} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === 'tomorrow' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Morgen
            </button>
            <button 
              onClick={() => setFilter('week')} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Diese Woche
            </button>
            <button 
              onClick={() => setFilter('month')} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Dieser Monat
            </button>
          </div>

          {/* Weitere Filter */}
          <div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center space-x-1"
            >
              <SafeIcon icon={FiFilter} className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter</span>
              <SafeIcon icon={showFilters ? FiChevronUp : FiChevronDown} className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Erweiterte Filter */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Mitarbeiter-Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mitarbeiter
              </label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle Mitarbeiter</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} {employee.role ? `(${employee.role})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status-Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Anzeige der gefilterten Ergebnisse */}
      {getFilteredPlanItems().length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <SafeIcon icon={FiCalendar} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Termine gefunden</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Für die gewählten Filterkriterien wurden keine Termine gefunden. Versuchen Sie andere Filter oder legen Sie neue Termine in den Projekten an.
          </p>
        </div>
      ) : (
        <>
          {/* Kalenderansicht */}
          {view === 'calendar' && (
            <div className="space-y-6">
              {Object.entries(getPlanItemsByDate()).map(([date, items]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2 text-blue-600" />
                      {formatDateDisplay(date)}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Link 
                                to={`/project/${item.projectId}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {item.projectName}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(item.status)}-100 text-${getStatusColor(item.status)}-800`}>
                                {item.status === 'geplant' ? 'Geplant' : 
                                 item.status === 'in_progress' ? 'In Bearbeitung' :
                                 item.status === 'completed' ? 'Abgeschlossen' : 'Abgebrochen'}
                              </span>
                              {item.priority && item.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${getPriorityColor(item.priority)}-100 text-${getPriorityColor(item.priority)}-800`}>
                                  {item.priority === 'low' ? 'Niedrig' : 
                                   item.priority === 'high' ? 'Hoch' : 'Dringend'}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                <SafeIcon icon={FiClock} className="w-3 h-3" />
                                <span>{item.startTime.substring(0, 5)} - {item.endTime.substring(0, 5)}</span>
                              </div>
                              {item.location && (
                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                  <SafeIcon icon={FiMapPin} className="w-3 h-3" />
                                  <span>{item.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {item.assignedEmployees && item.assignedEmployees.length > 0 && (
                            <div className="ml-4">
                              <div className="flex -space-x-2">
                                {item.assignedEmployees.slice(0, 3).map((employeeId, index) => {
                                  const employee = employees.find(e => e.id === employeeId);
                                  return (
                                    <div 
                                      key={employeeId} 
                                      className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"
                                      title={employee?.name || 'Unbekannt'}
                                    >
                                      <span className="text-xs font-medium text-blue-700">
                                        {employee?.name?.charAt(0) || '?'}
                                      </span>
                                    </div>
                                  );
                                })}
                                {item.assignedEmployees.length > 3 && (
                                  <div 
                                    className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
                                    title="Weitere Mitarbeiter"
                                  >
                                    <span className="text-xs font-medium text-gray-700">
                                      +{item.assignedEmployees.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Gantt-Diagramm */}
          {view === 'gantt' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Gantt-Diagramm</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Geplant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-600">In Bearbeitung</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Abgeschlossen</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">Abgebrochen</span>
                  </div>
                </div>
              </div>
              <div className="h-96">
                <ReactECharts 
                  option={getGanttOption()} 
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </motion.div>
          )}

          {/* Listenansicht */}
          {view === 'list' && (
            <div className="space-y-4">
              {Object.entries(getPlanItemsByProject()).map(([projectId, { project, items }]) => (
                <motion.div
                  key={projectId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div 
                    className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleProjectExpand(projectId)}
                  >
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900 mr-2">{project.name}</h3>
                      <span className="text-xs text-gray-500">({items.length} Termine)</span>
                    </div>
                    <SafeIcon 
                      icon={expandedProjects[projectId] ? FiChevronUp : FiChevronDown} 
                      className="w-4 h-4 text-gray-600" 
                    />
                  </div>
                  
                  {expandedProjects[projectId] && (
                    <div className="divide-y divide-gray-100">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Termin
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Datum
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mitarbeiter
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {items.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                  {item.description && (
                                    <div className="text-xs text-gray-500 line-clamp-2">{item.description}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {format(new Date(item.startDate), 'dd.MM.yyyy')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.startTime.substring(0, 5)} - {item.endTime.substring(0, 5)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(item.status)}-100 text-${getStatusColor(item.status)}-800`}>
                                  {item.status === 'geplant' ? 'Geplant' : 
                                   item.status === 'in_progress' ? 'In Bearbeitung' :
                                   item.status === 'completed' ? 'Abgeschlossen' : 'Abgebrochen'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {item.assignedEmployees && item.assignedEmployees.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {item.assignedEmployees.map((employeeId) => {
                                      const employee = employees.find(e => e.id === employeeId);
                                      return employee ? (
                                        <span 
                                          key={employeeId}
                                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                        >
                                          {employee.name}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Keine Zuweisungen</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Statistik */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Geplant</p>
              <p className="text-2xl font-bold text-gray-900">
                {allPlanItems.filter(item => item.status === 'geplant').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <SafeIcon icon={FiCalendar} className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Bearbeitung</p>
              <p className="text-2xl font-bold text-gray-900">
                {allPlanItems.filter(item => item.status === 'in_progress').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <SafeIcon icon={FiActivity} className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abgeschlossen</p>
              <p className="text-2xl font-bold text-gray-900">
                {allPlanItems.filter(item => item.status === 'completed').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Insgesamt</p>
              <p className="text-2xl font-bold text-gray-900">{allPlanItems.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <SafeIcon icon={FiLayers} className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GlobalPlanningModule;