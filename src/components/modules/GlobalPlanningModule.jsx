import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import SafeIcon from '../../common/SafeIcon';
import CalendarPicker from '../common/CalendarPicker';
import * as FiIcons from 'react-icons/fi';
import ReactECharts from 'echarts-for-react';
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  addDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  differenceInDays,
  addWeeks,
  isSameMonth,
  getISOWeek,
  startOfISOWeek,
  endOfISOWeek
} from 'date-fns';
import { de } from 'date-fns/locale';

const { FiCalendar, FiClock, FiUser, FiFilter, FiSearch, FiGrid, FiList, FiChevronDown, FiChevronUp, FiMapPin,
  FiActivity, FiLayers, FiCheck, FiX, FiPlus, FiEdit2, FiUsers, FiArrowRight, FiCopy, FiChevronLeft,
  FiChevronRight, FiMove, FiMenu, FiExternalLink } = FiIcons;

const GlobalPlanningModule = () => {
  const { projects } = useProjects();
  const { employees } = useSettings();
  const navigate = useNavigate();

  // Ansichtssteuerung
  const [view, setView] = useState('calendar');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});

  // Timeline-Ansicht Status
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timelineView, setTimelineView] = useState('day');
  const [showProjectDropdown, setShowProjectDropdown] = useState(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timeForm, setTimeForm] = useState({
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '17:00'
  });

  // Mobile Responsivität
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Drag & Drop Status
  const [draggedProject, setDraggedProject] = useState(null);
  const [isCommandPressed, setIsCommandPressed] = useState(false);

  // Assignments und Datumsbereich
  const [timelineAssignments, setTimelineAssignments] = useState([]);
  const [visibleDateRange, setVisibleDateRange] = useState({ start: new Date(), end: new Date() });

  // Resize-Handling Status
  const [resizing, setResizing] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [originalAssignment, setOriginalAssignment] = useState(null);

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sammle alle Planungselemente aus allen Projekten
  const [allPlanItems, setAllPlanItems] = useState([]);
  
  // Aktualisiere allPlanItems wenn sich projects ändert
  useEffect(() => {
    const planItems = projects.flatMap(project => {
      const items = project.planItems || [];
      return items.map(item => ({
        ...item,
        projectId: project.id,
        projectName: project.name
      }));
    });
    setAllPlanItems(planItems);
  }, [projects]);

  // Zeitslots generieren (reduziert für mobile Ansicht)
  const generateTimeSlots = () => {
    const slots = [];
    const increment = isMobile ? 60 : 30; // 1h für mobile, 30min für desktop
    const startHour = isMobile ? 8 : 7;
    const endHour = isMobile ? 18 : 18;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += increment) {
        if (hour === endHour && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Lade gespeicherte Assignments aus dem localStorage
  useEffect(() => {
    try {
      const savedAssignments = localStorage.getItem('timelineAssignments');
      if (savedAssignments) {
        const parsedAssignments = JSON.parse(savedAssignments);
        setTimelineAssignments(parsedAssignments);
      } else {
        initializeTimelineAssignments();
      }
    } catch (error) {
      console.error("Error loading saved assignments:", error);
      initializeTimelineAssignments();
    }
  }, []);

  // Initialisiere timelineAssignments mit allPlanItems
  // Aktualisiere auch, wenn sich allPlanItems ändert
  useEffect(() => {
    if (allPlanItems.length > 0) {
      initializeTimelineAssignments();
    }
  }, [allPlanItems]);

  const initializeTimelineAssignments = () => {
    const planItemsAsAssignments = allPlanItems.map(item => ({
      id: `plan-${item.id}`,
      projectId: item.projectId,
      projectName: item.projectName,
      employeeId: item.assignedEmployees && item.assignedEmployees.length > 0 ? item.assignedEmployees[0] : null,
      employeeName: item.assignedEmployees && item.assignedEmployees.length > 0 
        ? employees.find(e => e.id === item.assignedEmployees[0])?.name || 'Unbekannt' 
        : 'Nicht zugewiesen',
      startDate: item.startDate,
      endDate: item.endDate || item.startDate,
      startTime: item.startTime || '08:00',
      endTime: item.endTime || '17:00',
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      color: getProjectColor(item.projectId)
    }));

    // Merge mit bestehenden Assignments, ersetze alte Plan-Items aber behalte manuelle Assignments
    const existingCustomAssignments = timelineAssignments.filter(a => !a.id.startsWith('plan-'));
    const newAssignments = [...existingCustomAssignments, ...planItemsAsAssignments];
    
    setTimelineAssignments(newAssignments);
    localStorage.setItem('timelineAssignments', JSON.stringify(newAssignments));
  };

  // Speichere timelineAssignments im localStorage
  const saveTimelineAssignments = (assignments) => {
    localStorage.setItem('timelineAssignments', JSON.stringify(assignments));
  };

  // Keyboard event listeners für Command-Taste
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        setIsCommandPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsCommandPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update visible date range when timeline view or selected date changes
  useEffect(() => {
    const selectedDateObj = new Date(selectedDate);
    let startDate, endDate;

    switch (timelineView) {
      case 'day':
        startDate = selectedDateObj;
        endDate = selectedDateObj;
        break;
      case 'week':
        startDate = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
        endDate = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
        break;
      case 'twoWeek':
        startDate = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
        endDate = addDays(endOfWeek(selectedDateObj, { weekStartsOn: 1 }), 7);
        break;
      case 'fourWeek':
        startDate = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
        endDate = addDays(endOfWeek(selectedDateObj, { weekStartsOn: 1 }), 21);
        break;
      case 'month':
        startDate = startOfMonth(selectedDateObj);
        endDate = endOfMonth(selectedDateObj);
        break;
      default:
        startDate = selectedDateObj;
        endDate = selectedDateObj;
    }

    setVisibleDateRange({ start: startDate, end: endDate });
  }, [timelineView, selectedDate]);

  // Projekt-Farbe generieren
  const getProjectColor = (projectId) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const index = projectId.charCodeAt(projectId.length - 1) % colors.length;
    return colors[index];
  };

  const toggleProjectExpand = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Navigation im Datumsbereich
  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    let newDate;

    switch (timelineView) {
      case 'day':
        newDate = direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1);
        break;
      case 'week':
        newDate = direction === 'next' ? addDays(currentDate, 7) : addDays(currentDate, -7);
        break;
      case 'twoWeek':
        newDate = direction === 'next' ? addDays(currentDate, 14) : addDays(currentDate, -14);
        break;
      case 'fourWeek':
        newDate = direction === 'next' ? addDays(currentDate, 28) : addDays(currentDate, -28);
        break;
      case 'month':
        const newMonth = direction === 'next' ? currentDate.getMonth() + 1 : currentDate.getMonth() - 1;
        newDate = new Date(currentDate.setMonth(newMonth));
        break;
      default:
        newDate = direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1);
    }

    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Projekt-Dropdown Handler
  const handleProjectSelect = (project, employee, date = selectedDate) => {
    setSelectedProject(project);
    setSelectedEmployee(employee);
    setTimeForm({
      startDate: date,
      endDate: date,
      startTime: '08:00',
      endTime: '17:00'
    });
    setShowTimeModal(true);
    setShowProjectDropdown(null);
  };

  // Zeit-Modal Handler
  const handleTimeSubmit = (e) => {
    e.preventDefault();

    const newAssignment = {
      id: `assignment-${Date.now()}`,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      startDate: timeForm.startDate,
      endDate: timeForm.endDate,
      startTime: timeForm.startTime,
      endTime: timeForm.endTime,
      color: getProjectColor(selectedProject.id)
    };

    const updatedAssignments = [...timelineAssignments, newAssignment];
    setTimelineAssignments(updatedAssignments);
    saveTimelineAssignments(updatedAssignments);

    setShowTimeModal(false);
    resetTimeForm();
  };

  const resetTimeForm = () => {
    setSelectedProject(null);
    setSelectedEmployee(null);
    setTimeForm({
      startDate: '',
      endDate: '',
      startTime: '08:00',
      endTime: '17:00'
    });
  };

  // Assignment löschen
  const handleDeleteAssignment = (assignmentId) => {
    const updatedAssignments = timelineAssignments.filter(a => a.id !== assignmentId);
    setTimelineAssignments(updatedAssignments);
    saveTimelineAssignments(updatedAssignments);
  };

  // Navigiere zum Projekt-Cockpit wenn auf ein Projekt geklickt wird
  const handleProjectClick = (projectId, event) => {
    // Verhindere Navigation, wenn der Lösch-Button geklickt wurde
    if (event.target.closest('button')) {
      return;
    }
    navigate(`/project/${projectId}`);
  };

  // Handler für das Hinzufügen eines Termins über einen Klick auf eine Zelle
  const handleCellClick = (employee, date) => {
    const dateString = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    console.log('Cell clicked:', employee.name, dateString);
    setSelectedEmployee(employee);
    setProjectSearch(''); // Reset search when opening dropdown
    setShowProjectDropdown(`${employee.id}-${dateString}`);
  };

  // Schließe Dropdown wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProjectDropdown && !event.target.closest('.project-dropdown-container')) {
        setShowProjectDropdown(null);
        setProjectSearch(''); // Reset search when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProjectDropdown]);

  // Filtere die Planungselemente
  const getFilteredPlanItems = () => {
    let filtered = [...allPlanItems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.projectName.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query)
      );
    }

    if (employeeFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.assignedEmployees?.includes(employeeFilter)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.status === statusFilter
      );
    }

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

  // Gruppiere Planungselemente nach Projekten
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

  // Gruppiere Planungselemente nach Datum
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

  // Generiere Daten für mehrtägige Ansichten
  const getDaysInView = () => {
    return eachDayOfInterval({
      start: visibleDateRange.start,
      end: visibleDateRange.end
    });
  };

  // Überprüft, ob ein Assignment an einem bestimmten Tag angezeigt werden soll
  const isAssignmentVisibleOnDay = (assignment, day) => {
    const assignmentStart = parseISO(assignment.startDate);
    const assignmentEnd = parseISO(assignment.endDate || assignment.startDate);
    
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const assignmentStartDay = new Date(assignmentStart);
    assignmentStartDay.setHours(0, 0, 0, 0);
    
    const assignmentEndDay = new Date(assignmentEnd);
    assignmentEndDay.setHours(0, 0, 0, 0);

    return (
      dayStart >= assignmentStartDay && dayStart <= assignmentEndDay
    );
  };

  // Funktion um Text basierend auf der Ansicht zu kürzen
  const getTruncatedProjectName = (projectName, view) => {
    if (!projectName) return '';
    switch (view) {
      case 'fourWeek':
        return projectName.length > 8 ? projectName.substring(0, 6) + '...' : projectName;
      case 'month':
        return projectName.length > 6 ? projectName.substring(0, 4) + '...' : projectName;
      case 'twoWeek':
        return projectName.length > 12 ? projectName.substring(0, 10) + '...' : projectName;
      case 'week':
        return projectName.length > 15 ? projectName.substring(0, 13) + '...' : projectName;
      default:
        return projectName;
    }
  };

  // Prüfe ob Details angezeigt werden sollen (abhängig von der Ansicht)
  const shouldShowDetails = (view) => {
    return view === 'day' || view === 'week';
  };

  // Gruppiere Tage nach Kalenderwoche
  const getDaysGroupedByCalendarWeek = () => {
    const days = getDaysInView();
    const weekGroups = {};

    days.forEach(day => {
      const weekNumber = getISOWeek(day);
      const year = day.getFullYear();
      const weekKey = `${year}-W${weekNumber}`;

      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = {
          weekNumber,
          year,
          days: []
        };
      }

      weekGroups[weekKey].days.push(day);
    });

    return Object.values(weekGroups);
  };

  // Responsive Timeline-Ansicht rendern
  const renderTimelineView = () => {
    const days = getDaysInView();
    const weekGroups = getDaysGroupedByCalendarWeek();

    return (
      <div className="space-y-4">
        {/* Mobile Navigation Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <div className="flex flex-col space-y-4">
            {/* Title and Mobile Menu Toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Zeitplan</h3>
              {isMobile && (
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiMenu} className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Navigation Controls - Always visible on desktop, collapsible on mobile */}
            <div className={`${isMobile && !showMobileMenu ? 'hidden' : 'block'} space-y-4`}>
              {/* Date Navigation */}
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiChevronLeft} className="w-5 h-5 text-gray-600" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiChevronRight} className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* View Selection - Responsive Grid */}
              <div className="grid grid-cols-2 md:flex md:items-center md:space-x-2 md:bg-gray-100 md:rounded-lg md:p-1 gap-2 md:gap-0">
                <button
                  onClick={() => setTimelineView('day')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    timelineView === 'day'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 md:bg-transparent text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tag
                </button>
                <button
                  onClick={() => setTimelineView('week')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    timelineView === 'week'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 md:bg-transparent text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Woche
                </button>
                {!isMobile && (
                  <>
                    <button
                      onClick={() => setTimelineView('twoWeek')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        timelineView === 'twoWeek'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-gray-100 md:bg-transparent text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      2 Wochen
                    </button>
                    <button
                      onClick={() => setTimelineView('fourWeek')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        timelineView === 'fourWeek'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-gray-100 md:bg-transparent text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      4 Wochen
                    </button>
                  </>
                )}
                <button
                  onClick={() => setTimelineView('month')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    timelineView === 'month'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 md:bg-transparent text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Monat
                </button>
              </div>
            </div>

            {/* Date Range Display */}
            <div className="text-sm text-gray-600 text-center">
              {timelineView === 'day' ? (
                <span>{formatDateDisplay(selectedDate)}</span>
              ) : (
                <span>
                  {format(visibleDateRange.start, 'dd.MM.yyyy')} - {format(visibleDateRange.end, 'dd.MM.yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Grid - Responsive */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {timelineView === 'day' ? (
              /* Tagesansicht - Responsive */
              <div className={`${isMobile ? 'min-w-[600px]' : 'min-w-[1200px]'}`}>
                {/* Header mit Zeitslots */}
                <div className={`grid ${isMobile ? 'grid-cols-[120px_repeat(11,1fr)]' : 'grid-cols-[200px_repeat(23,1fr)]'} border-b border-gray-200 bg-gray-50`}>
                  <div className="p-2 md:p-3 font-medium text-gray-900 border-r border-gray-200 text-xs md:text-sm">
                    Mitarbeiter
                  </div>
                  {timeSlots.map(time => (
                    <div key={time} className="p-1 md:p-2 text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                      {time}
                    </div>
                  ))}
                </div>

                {/* Mitarbeiter-Zeilen */}
                {employees.map(employee => {
                  const employeeAssignments = timelineAssignments.filter(
                    a => a.employeeId === employee.id && (
                      a.startDate === selectedDate || 
                      a.endDate === selectedDate || 
                      (a.startDate <= selectedDate && a.endDate >= selectedDate)
                    )
                  );

                  return (
                    <div
                      key={employee.id}
                      className={`grid ${isMobile ? 'grid-cols-[120px_repeat(11,1fr)]' : 'grid-cols-[200px_repeat(23,1fr)]'} border-b border-gray-200 hover:bg-gray-50 relative`}
                    >
                      {/* Mitarbeiter Name */}
                      <div className="p-2 md:p-3 border-r border-gray-200 bg-white">
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <SafeIcon icon={FiUser} className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-xs md:text-sm truncate">{employee.name}</p>
                            <p className="text-xs text-gray-500 truncate">{employee.role}</p>
                          </div>
                        </div>
                      </div>

                      {/* Zeit-Slots */}
                      {timeSlots.map((time, index) => (
                        <div
                          key={time}
                          className="h-12 md:h-16 border-r border-gray-200 relative cursor-pointer hover:bg-blue-50"
                          onClick={() => handleCellClick(employee, selectedDate)}
                        >
                          {/* Projekt-Assignments */}
                          {employeeAssignments.map(assignment => {
                            const startSlot = timeSlots.indexOf(assignment.startTime);
                            const endSlot = timeSlots.indexOf(assignment.endTime);

                            if (index >= startSlot && index < endSlot) {
                              const isFirstSlot = index === startSlot;
                              const width = endSlot - startSlot;

                              return isFirstSlot ? (
                                <div
                                  key={assignment.id}
                                  className="absolute inset-y-1 left-1 right-1 rounded text-white text-xs p-1 cursor-pointer z-10 group overflow-hidden"
                                  style={{
                                    backgroundColor: assignment.color,
                                    width: `calc(${width * 100}% - 8px)`,
                                    maxWidth: `calc(${width * 100}% - 8px)`,
                                    minWidth: isMobile ? '40px' : '60px'
                                  }}
                                  title={`${assignment.projectName} (${assignment.startTime} - ${assignment.endTime})`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProjectClick(assignment.projectId, e);
                                  }}
                                >
                                  {/* Projekt-Inhalt */}
                                  <div className="flex items-center justify-between h-full overflow-hidden">
                                    <span className="truncate font-medium text-xs flex-1 mr-1">
                                      {getTruncatedProjectName(assignment.projectName, timelineView)}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAssignment(assignment.id);
                                      }}
                                      className="flex-shrink-0 hover:bg-black hover:bg-opacity-20 rounded p-0.5"
                                    >
                                      <SafeIcon icon={FiX} className="w-2 h-2 md:w-3 md:h-3" />
                                    </button>
                                  </div>

                                  {!isMobile && shouldShowDetails(timelineView) && (
                                    <div className="text-xs opacity-80 truncate">
                                      {assignment.startTime} - {assignment.endTime}
                                    </div>
                                  )}

                                  <div className="opacity-0 group-hover:opacity-100 absolute right-1 bottom-1 bg-white bg-opacity-20 rounded">
                                    <SafeIcon icon={FiExternalLink} className="w-2 h-2 md:w-3 md:h-3" />
                                  </div>
                                </div>
                              ) : null;
                            }
                            return null;
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Mehrtägige Ansicht - Responsive mit verbessertem Overflow-Schutz */
              <div className={`${isMobile ? 'min-w-[500px]' : 'min-w-[900px]'}`}>
                {/* Header mit Kalenderwochen - NEUE ZEILE */}
                <div className="grid" style={{gridTemplateColumns: `${isMobile ? '100px' : '200px'} repeat(${days.length},1fr)`}}>
                  {/* Leere Ecke oben links */}
                  <div className="p-2 md:p-3 font-medium text-gray-900 border-r border-b border-gray-200 bg-gray-50 text-xs md:text-sm">
                    KW
                  </div>

                  {/* Kalenderwochen-Header */}
                  {weekGroups.map((weekGroup, index) => (
                    <div
                      key={`week-${weekGroup.weekNumber}`}
                      className="border-r border-b border-gray-200 bg-blue-50 text-center"
                      style={{
                        gridColumn: `span ${weekGroup.days.length}`,
                      }}
                    >
                      <div className="p-1 text-xs font-medium text-blue-800">
                        KW {weekGroup.weekNumber}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Header mit Tagen */}
                <div className="grid" style={{gridTemplateColumns: `${isMobile ? '100px' : '200px'} repeat(${days.length},1fr)`}}>
                  <div className="p-2 md:p-3 font-medium text-gray-900 border-r border-gray-200 bg-gray-50 text-xs md:text-sm">
                    Mitarbeiter
                  </div>

                  {days.map((day, index) => (
                    <div key={index} className="p-1 md:p-2 text-xs font-medium text-gray-600 text-center border-r border-gray-200 bg-gray-50 flex flex-col">
                      <span className="font-medium">{format(day, 'E', { locale: de })}</span>
                      <span className="mt-1">{format(day, 'dd.MM')}</span>
                      {isToday(day) && (
                        <span className="mt-1 inline-block px-1 py-0.5 bg-blue-100 text-blue-800 text-[8px] md:text-[10px] rounded-full">
                          Heute
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mitarbeiter-Zeilen */}
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    className="grid border-b border-gray-200 hover:bg-gray-50"
                    style={{gridTemplateColumns: `${isMobile ? '100px' : '200px'} repeat(${days.length},1fr)`}}
                  >
                    {/* Mitarbeiter Name */}
                    <div className="p-2 md:p-3 border-r border-gray-200 bg-white">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <SafeIcon icon={FiUser} className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-xs md:text-sm truncate">{employee.name}</p>
                          <p className="text-xs text-gray-500 truncate">{employee.role}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tages-Zellen */}
                    {days.map((day, dayIndex) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const dayAssignments = timelineAssignments.filter(
                        a => a.employeeId === employee.id && isAssignmentVisibleOnDay(a, day)
                      );

                      return (
                        <div
                          key={dayIndex}
                          className="min-h-[80px] md:min-h-[100px] border-r border-gray-200 relative cursor-pointer hover:bg-blue-50 overflow-hidden"
                          onClick={(e) => {
                            // Nur wenn nicht auf ein Assignment geklickt wurde
                            if (!e.target.closest('.assignment-item')) {
                              console.log('Cell clicked in multi-day view:', employee.name, dayStr);
                              handleCellClick(employee, day);
                            }
                          }}
                        >
                          {/* Projekt-Assignments für den Tag */}
                          <div className="p-1 flex flex-col gap-1 h-full overflow-hidden">
                            {dayAssignments.map(assignment => (
                              <div
                                key={assignment.id}
                                className="assignment-item rounded text-white text-xs p-1 cursor-pointer group relative overflow-hidden flex-shrink-0"
                                style={{
                                  backgroundColor: assignment.color,
                                  maxHeight: timelineView === 'month' ? '20px' : timelineView === 'fourWeek' ? '24px' : '32px'
                                }}
                                title={`${assignment.projectName}${shouldShowDetails(timelineView) ? ` (${assignment.startTime} - ${assignment.endTime})` : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProjectClick(assignment.projectId, e)
                                }}
                              >
                                <div className="flex items-center justify-between h-full overflow-hidden">
                                  <span className="truncate font-medium text-xs flex-1 mr-1 leading-tight">
                                    {getTruncatedProjectName(assignment.projectName, timelineView)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAssignment(assignment.id);
                                    }}
                                    className="flex-shrink-0 hover:bg-black hover:bg-opacity-20 rounded p-0.5"
                                  >
                                    <SafeIcon icon={FiX} className="w-2 h-2 md:w-3 md:h-3" />
                                  </button>
                                </div>

                                {shouldShowDetails(timelineView) && !isMobile && (
                                  <div className="text-xs opacity-80 truncate leading-tight">
                                    {assignment.startTime} - {assignment.endTime}
                                  </div>
                                )}

                                <div className="opacity-0 group-hover:opacity-100 absolute right-1 bottom-1 bg-white bg-opacity-20 rounded">
                                  <SafeIcon icon={FiExternalLink} className="w-2 h-2 md:w-3 md:h-3" />
                                </div>
                              </div>
                            ))}

                            {/* Plus-Button zum schnellen Hinzufügen */}
                            {dayAssignments.length === 0 && (
                              <button
                                className="mt-1 mx-auto w-5 h-5 md:w-6 md:h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Plus button clicked:', employee.name, dayStr);
                                  handleCellClick(employee, day);
                                }}
                              >
                                <SafeIcon icon={FiPlus} className="w-2 h-2 md:w-3 md:h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Projekt-Dropdown Popup - Improved positioning and styling */}
        {showProjectDropdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="project-dropdown-container bg-white rounded-lg shadow-xl w-full max-w-md max-h-[70vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Projekt zuweisen</h3>
                    <p className="text-sm text-gray-600">
                      {selectedEmployee?.name} • {format(new Date(showProjectDropdown.split('-')[1]), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProjectDropdown(null);
                      setProjectSearch('');
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Projekt suchen..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Project List */}
              <div className="max-h-80 overflow-y-auto">
                {projects
                  .filter(project => project.name.toLowerCase().includes(projectSearch.toLowerCase()))
                  .length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <SafeIcon icon={FiSearch} className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Keine Projekte gefunden</p>
                    <p className="text-sm">Versuchen Sie einen anderen Suchbegriff</p>
                  </div>
                ) : (
                  projects
                    .filter(project => project.name.toLowerCase().includes(projectSearch.toLowerCase()))
                    .map(project => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project, selectedEmployee, showProjectDropdown.split('-')[1])}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getProjectColor(project.id) }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-900 truncate">{project.name}</p>
                          <p className="text-xs text-gray-500 truncate">{project.customer}</p>
                          {project.description && (
                            <p className="text-xs text-gray-400 truncate mt-1">{project.description}</p>
                          )}
                        </div>
                        <SafeIcon icon={FiArrowRight} className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  Wählen Sie ein Projekt aus, um es dem Mitarbeiter zuzuweisen
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Mobile-optimierte Legende */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
          <h4 className="font-medium text-gray-900 mb-3 text-sm md:text-base">Bedienung</h4>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'md:grid-cols-4 gap-4'} text-sm`}>
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiPlus} className="w-4 h-4 text-blue-600" />
              <span className="text-xs md:text-sm">Auf leere Zelle klicken: Projekt zuweisen</span>
            </div>
            {!isMobile && (
              <>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiArrowRight} className="w-4 h-4 text-green-600" />
                  <span>Drag & Drop: Projekt verschieben</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMove} className="w-4 h-4 text-orange-600" />
                  <span>Rand ziehen: Zeit ändern</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiCopy} className="w-4 h-4 text-purple-600" />
                  <span>Cmd/Ctrl + Drag: Projekt kopieren</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
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
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Globale Projektplanung</h1>
        <p className="text-sm md:text-base text-gray-600">Übersicht aller Termine und Planungen in allen Projekten</p>
      </div>

      {/* Responsive Steuerungselemente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col space-y-4">
          {/* Ansicht wählen - Mobile Stack */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-2 md:flex md:items-center md:space-x-2 md:bg-gray-100 md:rounded-lg md:p-1 gap-2 md:gap-0">
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-2 rounded-md flex items-center justify-center space-x-1 text-sm font-medium ${
                  view === 'calendar'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 md:bg-transparent text-gray-600'
                }`}
              >
                <SafeIcon icon={FiCalendar} className="w-4 h-4" />
                <span className="hidden sm:inline">Kalender</span>
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`px-3 py-2 rounded-md flex items-center justify-center space-x-1 text-sm font-medium ${
                  view === 'timeline'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 md:bg-transparent text-gray-600'
                }`}
              >
                <SafeIcon icon={FiUsers} className="w-4 h-4" />
                <span className="hidden sm:inline">Timeline</span>
              </button>
              {!isMobile && (
                <>
                  <button
                    onClick={() => setView('gantt')}
                    className={`px-3 py-2 rounded-md flex items-center space-x-1 ${
                      view === 'gantt' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    <SafeIcon icon={FiLayers} className="w-4 h-4" />
                    <span className="text-sm font-medium">Gantt</span>
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`px-3 py-2 rounded-md flex items-center space-x-1 ${
                      view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    <SafeIcon icon={FiList} className="w-4 h-4" />
                    <span className="text-sm font-medium">Liste</span>
                  </button>
                </>
              )}
            </div>

            {/* Suchfeld - Full width on mobile */}
            <div className="relative w-full md:w-auto md:min-w-[250px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SafeIcon icon={FiSearch} className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Termine suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Zeitfilter - Mobile Scroll */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium whitespace-nowrap ${
                filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium whitespace-nowrap ${
                filter === 'today' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Heute
            </button>
            <button
              onClick={() => setFilter('tomorrow')}
              className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium whitespace-nowrap ${
                filter === 'tomorrow' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Morgen
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium whitespace-nowrap ${
                filter === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Diese Woche
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium whitespace-nowrap ${
                filter === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dieser Monat
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center space-x-1 whitespace-nowrap"
            >
              <SafeIcon icon={FiFilter} className="w-4 h-4 text-gray-600" />
              <span className="text-xs md:text-sm font-medium text-gray-700">Filter</span>
              <SafeIcon
                icon={showFilters ? FiChevronUp : FiChevronDown}
                className="w-4 h-4 text-gray-600"
              />
            </button>
          </div>

          {/* Erweiterte Filter */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Mitarbeiter-Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mitarbeiter
                </label>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
      </div>

      {/* Anzeige der gefilterten Ergebnisse */}
      {getFilteredPlanItems().length === 0 && view !== 'timeline' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <SafeIcon icon={FiCalendar} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Termine gefunden</h3>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            Für die gewählten Filterkriterien wurden keine Termine gefunden. Versuchen Sie andere Filter oder legen Sie neue Termine in den Projekten an.
          </p>
        </div>
      ) : (
        <>
          {/* Timeline-Ansicht */}
          {view === 'timeline' && renderTimelineView()}

          {/* Andere Ansichten bleiben unverändert aber bekommen responsive Klassen */}
          {view === 'calendar' && (
            <div className="space-y-4 md:space-y-6">
              {Object.entries(getPlanItemsByDate()).map(([date, items]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-medium text-gray-900 flex items-center text-sm md:text-base">
                      <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2 text-blue-600" />
                      {formatDateDisplay(date)}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map(item => (
                      <div key={item.id} className="p-3 md:p-4 hover:bg-gray-50">
                        <div className="flex flex-col md:flex-row md:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Link to={`/project/${item.projectId}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                {item.projectName}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(item.status)}-100 text-${getStatusColor(item.status)}-800`}>
                                {item.status === 'geplant' ? 'Geplant' : item.status === 'in_progress' ? 'In Bearbeitung' : item.status === 'completed' ? 'Abgeschlossen' : 'Abgebrochen'}
                              </span>
                              {item.priority && item.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${getPriorityColor(item.priority)}-100 text-${getPriorityColor(item.priority)}-800`}>
                                  {item.priority === 'low' ? 'Niedrig' : item.priority === 'high' ? 'Hoch' : 'Dringend'}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 text-sm md:text-base">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs">
                              <div className="flex items-center space-x-1 text-gray-600">
                                <SafeIcon icon={FiClock} className="w-3 h-3" />
                                <span>{item.startTime.substring(0, 5)} - {item.endTime.substring(0, 5)}</span>
                              </div>
                              {item.location && (
                                <div className="flex items-center space-x-1 text-gray-600">
                                  <SafeIcon icon={FiMapPin} className="w-3 h-3" />
                                  <span>{item.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {item.assignedEmployees && item.assignedEmployees.length > 0 && (
                            <div className="flex-shrink-0">
                              <div className="flex -space-x-2">
                                {item.assignedEmployees.slice(0, 3).map((employeeId, index) => {
                                  const employee = employees.find(e => e.id === employeeId);
                                  return (
                                    <div
                                      key={employeeId}
                                      className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"
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
                                    className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
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
        </>
      )}

      {/* Zeit-Modal - Responsive mit Custom Calendar */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
          >
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Projekt zuweisen</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProject?.name} → {selectedEmployee?.name}
              </p>
            </div>

            <form onSubmit={handleTimeSubmit} className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startdatum
                  </label>
                  <CalendarPicker
                    value={timeForm.startDate}
                    onChange={(date) => setTimeForm(prev => ({ ...prev, startDate: date }))}
                    placeholder="Startdatum wählen"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enddatum
                  </label>
                  <CalendarPicker
                    value={timeForm.endDate}
                    onChange={(date) => setTimeForm(prev => ({ ...prev, endDate: date }))}
                    placeholder="Enddatum wählen"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startzeit
                  </label>
                  <select
                    value={timeForm.startTime}
                    onChange={(e) => setTimeForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit
                  </label>
                  <select
                    value={timeForm.endTime}
                    onChange={(e) => setTimeForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTimeModal(false);
                    resetTimeForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Zuweisen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Responsive Statistik */}
      <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Geplant</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {allPlanItems.filter(item => item.status === 'geplant').length}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <SafeIcon icon={FiCalendar} className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">In Bearbeitung</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {allPlanItems.filter(item => item.status === 'in_progress').length}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <SafeIcon icon={FiActivity} className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Abgeschlossen</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {allPlanItems.filter(item => item.status === 'completed').length}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center">
              <SafeIcon icon={FiCheck} className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Insgesamt</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{allPlanItems.length}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <SafeIcon icon={FiLayers} className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GlobalPlanningModule;