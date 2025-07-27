import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiDelete, FiRotateCcw } = FiIcons;

const Calculator = ({ onResult, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [calculation, setCalculation] = useState('');
  const [history, setHistory] = useState([]);
  const [memory, setMemory] = useState([]);

  const buttons = [
    ['MC', 'MR', 'M+', 'M-'],
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '(', ')'],
    ['=', 'DEL', '←', 'OK']
  ];

  const handleButtonClick = (button) => {
    switch (button) {
      case 'C':
        setDisplay('0');
        setCalculation('');
        break;
      case 'DEL':
        setDisplay('0');
        setCalculation('');
        setHistory([]);
        setMemory([]);
        break;
      case '←':
        if (calculation.length > 0) {
          const newCalc = calculation.slice(0, -1);
          setCalculation(newCalc);
          setDisplay(newCalc || '0');
        }
        break;
      case '=':
        try {
          const result = evaluateExpression(calculation);
          setDisplay(result.toString());
          setHistory(prev => [...prev, `${calculation}=${result}`]);
        } catch (error) {
          setDisplay('Fehler');
        }
        break;
      case 'OK':
        try {
          const result = evaluateExpression(calculation);
          onResult(calculation, result);
        } catch (error) {
          alert('Ungültige Berechnung');
        }
        break;
      case 'MC':
        setMemory([]);
        break;
      case 'MR':
        if (memory.length > 0) {
          const value = memory[memory.length - 1];
          setCalculation(prev => prev + value);
          setDisplay(value.toString());
        }
        break;
      case 'M+':
        if (display !== '0' && display !== 'Fehler') {
          setMemory(prev => [...prev, parseFloat(display)]);
        }
        break;
      case 'M-':
        if (display !== '0' && display !== 'Fehler') {
          setMemory(prev => [...prev, -parseFloat(display)]);
        }
        break;
      case '±':
        if (display !== '0' && display !== 'Fehler') {
          const value = parseFloat(display);
          setDisplay((-value).toString());
          setCalculation(prev => prev.replace(/[0-9.]+$/, (-value).toString()));
        }
        break;
      case '%':
        if (display !== '0' && display !== 'Fehler') {
          const value = parseFloat(display) / 100;
          setDisplay(value.toString());
          setCalculation(prev => prev.replace(/[0-9.]+$/, value.toString()));
        }
        break;
      case '÷':
        setCalculation(prev => prev + '/');
        setDisplay('/');
        break;
      case '×':
        setCalculation(prev => prev + '*');
        setDisplay('×');
        break;
      default:
        if ('0123456789.+-()'.includes(button)) {
          setCalculation(prev => prev + button);
          setDisplay(button);
        }
        break;
    }
  };

  const evaluateExpression = (expression) => {
    // Replace display operators with JavaScript operators
    const jsExpression = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/--/g, '+');
    
    // Basic safety check
    if (!/^[0-9+\-*/.() ]+$/.test(jsExpression)) {
      throw new Error('Invalid expression');
    }

    try {
      const result = Function(`"use strict";return (${jsExpression})`)();
      return Math.round(result * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      throw new Error('Invalid expression');
    }
  };

  const getButtonStyle = (button) => {
    if (['=', 'OK'].includes(button)) {
      return 'bg-blue-600 text-white hover:bg-blue-700';
    }
    if (['C', 'DEL', '←'].includes(button)) {
      return 'bg-red-100 text-red-700 hover:bg-red-200';
    }
    if (['MC', 'MR', 'M+', 'M-'].includes(button)) {
      return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
    }
    if (['+', '-', '×', '÷', '=', '±', '%'].includes(button)) {
      return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
    }
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl w-[95%] max-w-[320px] sm:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Taschenrechner</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-3 sm:p-4">
          {/* Display */}
          <div className="mb-3 sm:mb-4">
            <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border">
              <div className="text-sm text-gray-600 mb-1 h-5 overflow-x-auto whitespace-nowrap">
                {calculation || ' '}
              </div>
              <div className="text-xl sm:text-2xl font-mono text-right text-gray-900 overflow-x-auto whitespace-nowrap">
                {display}
              </div>
            </div>
          </div>

          {/* Memory and History - Hidden on very small screens */}
          <div className="hidden xs:grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1 sm:mb-2">SPEICHER</h4>
              <div className="bg-gray-50 p-2 rounded text-xs h-12 sm:h-16 overflow-y-auto">
                {memory.length > 0 ? (
                  memory.map((value, index) => (
                    <div key={index}>{value}</div>
                  ))
                ) : (
                  <div className="text-gray-400">Leer</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1 sm:mb-2">VERLAUF</h4>
              <div className="bg-gray-50 p-2 rounded text-xs h-12 sm:h-16 overflow-y-auto">
                {history.length > 0 ? (
                  history.slice(-3).map((entry, index) => (
                    <div key={index} className="mb-1">{entry}</div>
                  ))
                ) : (
                  <div className="text-gray-400">Leer</div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons - Responsive grid */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {buttons.map((row, rowIndex) => (
              row.map((button, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleButtonClick(button)}
                  className={`
                    p-2 sm:p-3 rounded-lg font-medium transition-colors text-xs sm:text-sm
                    ${getButtonStyle(button)}
                  `}
                >
                  {button === '←' ? <SafeIcon icon={FiRotateCcw} className="w-3 h-3 sm:w-4 sm:h-4 mx-auto" /> : button}
                </button>
              ))
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Calculator;