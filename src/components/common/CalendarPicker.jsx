import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getISOWeek, isToday, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const { FiCalendar, FiChevronLeft, FiChevronRight, FiX } = FiIcons;

const CalendarPicker = ({ value, onChange, placeholder = "Datum auswählen", disabled = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(value ? parseISO(value) : null);
  const calendarRef = useRef(null);
  const inputRef = useRef(null);

  // Schließe Kalender wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selectedDate wenn value sich ändert
  useEffect(() => {
    if (value) {
      const date = parseISO(value);
      setSelectedDate(date);
      setCurrentMonth(date);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Generiere Kalendertage
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Montag als Wochenbeginn
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Gruppiere Tage nach Wochen
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const displayValue = selectedDate ? format(selectedDate, 'dd.MM.yyyy') : '';

  return (
    <div className="relative">
      {/* Input Field */}
      <div
        ref={inputRef}
        onClick={handleInputClick}
        className={`
          relative w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${className}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm ${displayValue ? 'text-gray-900' : 'text-gray-500'}`}>
            {displayValue || placeholder}
          </span>
          <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={calendarRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[280px]"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <SafeIcon icon={FiChevronLeft} className="w-4 h-4 text-gray-600" />
              </button>
              <h3 className="font-medium text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <SafeIcon icon={FiChevronRight} className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-8 gap-1 text-xs">
              {/* Header mit KW */}
              <div className="h-8 flex items-center justify-center font-medium text-blue-600 bg-blue-50 rounded">
                KW
              </div>
              
              {/* Wochentage */}
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="h-8 flex items-center justify-center font-medium text-gray-600">
                  {day}
                </div>
              ))}

              {/* Kalenderwochen und Tage */}
              {weeks.map((week, weekIndex) => {
                const weekNumber = getISOWeek(week[0]);
                return (
                  <React.Fragment key={weekIndex}>
                    {/* Kalenderwoche */}
                    <div className="h-8 flex items-center justify-center text-xs font-medium text-blue-600 bg-blue-50 rounded">
                      {weekNumber}
                    </div>
                    
                    {/* Tage der Woche */}
                    {week.map(day => {
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isCurrentDay = isToday(day);
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => handleDateSelect(day)}
                          className={`
                            h-8 flex items-center justify-center text-xs rounded transition-colors
                            ${!isCurrentMonth ? 'text-gray-300 hover:text-gray-400' : ''}
                            ${isCurrentMonth && !isSelected && !isCurrentDay ? 'text-gray-700 hover:bg-gray-100' : ''}
                            ${isSelected ? 'bg-blue-500 text-white font-medium' : ''}
                            ${isCurrentDay && !isSelected ? 'bg-blue-100 text-blue-600 font-medium' : ''}
                            ${isCurrentMonth ? 'hover:bg-blue-50' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Today Button */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => handleDateSelect(new Date())}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Heute auswählen
              </button>
              {selectedDate && (
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Löschen
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPicker;