import React,{useState,useEffect} from 'react';
import {useParams,Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useProjects} from '../../contexts/ProjectContext';
import {useSettings} from '../../contexts/SettingsContext';
import Calculator from '../calculator/Calculator';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {jsPDF} from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';

const {FiPlus,FiEdit2,FiTrash2,FiArrowLeft,FiCalculator,FiChevronDown,FiCheck,FiBarChart3,FiSigma,FiClipboard,FiDownload,FiFileText,FiFile}=FiIcons;

const MeasurementModule=()=> {
  const {id}=useParams();
  const {projects,addMeasurement,getProjectMeasurements,deleteMeasurement,updateMeasurement}=useProjects();
  const {trades,rooms,floors}=useSettings();
  const [project,setProject]=useState(null);
  const [measurements,setMeasurements]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [showCalculator,setShowCalculator]=useState(false);
  const [editingMeasurement,setEditingMeasurement]=useState(null);
  const [lastUsedLocation,setLastUsedLocation]=useState({floor: '',room: ''});
  const [showSummary,setShowSummary]=useState(false);
  const [showExportOptions,setShowExportOptions]=useState(false);
  const [formData,setFormData]=useState({
    floor: '',
    room: '',
    trades: [],// Changed to array for multiple selection
    unit: '',
    calculation: '',
    result: '',
    description: ''
  });
  const [showTradeDropdown,setShowTradeDropdown]=useState(false);

  useEffect(()=> {
    const currentProject=projects.find(p=> p.id===id);
    setProject(currentProject);
    setMeasurements(getProjectMeasurements(id));
    
    // Try to restore last used location from localStorage
    const savedLocation=localStorage.getItem(`meister-lastLocation-${id}`);
    if (savedLocation) {
      setLastUsedLocation(JSON.parse(savedLocation));
    }
  },[projects,id,getProjectMeasurements]);

  useEffect(()=> {
    // When showing the form,pre-fill with last used location or editing data
    if (showForm) {
      if (editingMeasurement) {
        // If editing,populate form with measurement data
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
        // If new measurement,use last location
        setFormData(prev=> ({
          ...prev,
          floor: lastUsedLocation.floor,
          room: lastUsedLocation.room
        }));
      }
    }
  },[showForm,lastUsedLocation,editingMeasurement]);

  // Berechne die Zusammenfassung aller Gewerke
  const calculateTradeSummary=()=> {
    const summary={};
    measurements.forEach(measurement=> {
      const key=measurement.trade;
      const result=parseFloat(measurement.result) || 0;
      if (!summary[key]) {
        summary[key]={
          trade: measurement.trade,
          unit: measurement.unit,
          total: 0,
          count: 0,
          locations: new Set()
        };
      }
      summary[key].total +=result;
      summary[key].count +=1;
      summary[key].locations.add(`${measurement.floor} - ${measurement.room}`);
    });

    // Convert Set to Array for locations
    Object.values(summary).forEach(item=> {
      item.locations=Array.from(item.locations);
    });

    return Object.values(summary).sort((a,b)=> b.total - a.total);
  };

  const handleTradeToggle=(tradeName)=> {
    setFormData(prev=> {
      const isSelected=prev.trades.includes(tradeName);
      const newTrades=isSelected 
        ? prev.trades.filter(t=> t !==tradeName)
        : [...prev.trades,tradeName];

      // Update unit based on selected trades
      let unit='';
      if (newTrades.length===1) {
        const trade=trades.find(t=> t.name===newTrades[0]);
        unit=trade?.unit || '';
      } else if (newTrades.length > 1) {
        // Check if all selected trades have the same unit
        const units=newTrades.map(tradeName=> {
          const trade=trades.find(t=> t.name===tradeName);
          return trade?.unit || '';
        });
        const uniqueUnits=[...new Set(units)];
        unit=uniqueUnits.length===1 ? uniqueUnits[0] : 'gemischt';
      }

      return {
        ...prev,
        trades: newTrades,
        unit
      };
    });
  };

  const handleCalculatorResult=(calculation,result)=> {
    setFormData(prev=> ({
      ...prev,
      calculation,
      result: result.toString()
    }));
    setShowCalculator(false);
  };

  const handleSubmit=(e)=> {
    e.preventDefault();
    
    if (editingMeasurement) {
      // Update existing measurement
      updateMeasurement(id,editingMeasurement.id,{
        floor: formData.floor,
        room: formData.room,
        trade: formData.trades[0],// When editing,we only allow one trade
        unit: formData.unit,
        calculation: formData.calculation,
        result: formData.result,
        description: formData.description
      });
    } else {
      // Create measurements for each selected trade
      formData.trades.forEach(tradeName=> {
        const trade=trades.find(t=> t.name===tradeName);
        const measurementData={
          floor: formData.floor,
          room: formData.room,
          trade: tradeName,
          unit: trade?.unit || formData.unit,
          calculation: formData.calculation,
          result: formData.result,
          description: formData.description
        };
        addMeasurement(id,measurementData);
      });
    }

    setMeasurements(getProjectMeasurements(id));
    
    // Save the last used location
    const newLastLocation={
      floor: formData.floor,
      room: formData.room
    };
    setLastUsedLocation(newLastLocation);
    localStorage.setItem(`meister-lastLocation-${id}`,JSON.stringify(newLastLocation));
    
    // Reset form but preserve the floor and room
    handleCloseForm();
  };

  const handleCloseForm=()=> {
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

  const handleEditMeasurement=(measurement)=> {
    setEditingMeasurement(measurement);
    setShowForm(true);
  };

  const handleDelete=(measurementId)=> {
    if (window.confirm('Sind Sie sicher,dass Sie diese Messung löschen möchten?')) {
      deleteMeasurement(id,measurementId);
      setMeasurements(getProjectMeasurements(id));
    }
  };

  // Export functions
  const exportToPDF=()=> {
    const doc=new jsPDF();
    const pageWidth=doc.internal.pageSize.width;

    // Add project details at the top
    doc.setFontSize(18);
    doc.text('Aufmaß-Dokumentation',pageWidth / 2,15,{align: 'center'});
    
    doc.setFontSize(12);
    doc.text(`Projekt: ${project?.name || 'Unbenannt'}`,14,25);
    doc.text(`Kunde: ${project?.customer || 'Nicht angegeben'}`,14,30);
    if (project?.address) {
      doc.text(`Adresse: ${project.address}`,14,35);
    }
    doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`,14,40);

    // Add a line
    doc.setDrawColor(200,200,200);
    doc.line(14,45,pageWidth - 14,45);

    // Add summary table if available
    const tradeSummary=calculateTradeSummary();
    if (tradeSummary.length > 0) {
      doc.setFontSize(14);
      doc.text('Zusammenfassung nach Gewerken',14,55);

      const summaryData=tradeSummary.map(item=> [
        item.trade,
        item.total.toFixed(2),
        item.unit,
        item.count
      ]);

      doc.autoTable({
        startY: 60,
        head: [['Gewerk','Summe','Einheit','Anzahl Messungen']],
        body: summaryData,
        theme: 'grid',
        headStyles: {fillColor: [59,130,246],textColor: [255,255,255]},
        styles: {fontSize: 10}
      });

      // Get the final y position after the summary table
      const finalY=doc.lastAutoTable.finalY + 10;

      // Add detailed measurements
      doc.setFontSize(14);
      doc.text('Detaillierte Messungen',14,finalY);

      // Group measurements by location
      const groupedMeasurements={};
      measurements.forEach(measurement=> {
        const key=`${measurement.floor}_${measurement.room}`;
        if (!groupedMeasurements[key]) {
          groupedMeasurements[key]={
            floor: measurement.floor,
            room: measurement.room,
            measurements: []
          };
        }
        groupedMeasurements[key].measurements.push(measurement);
      });

      let yPos=finalY + 10;
      Object.values(groupedMeasurements).forEach((group,groupIndex)=> {
        // Check if we need a new page
        if (yPos > doc.internal.pageSize.height - 40) {
          doc.addPage();
          yPos=20;
        }

        doc.setFontSize(12);
        doc.text(`${group.floor} - ${group.room}`,14,yPos);
        yPos +=5;

        const tableData=group.measurements.map(m=> [
          m.trade,
          m.calculation,
          m.result,
          m.unit,
          m.description || ''
        ]);

        doc.autoTable({
          startY: yPos,
          head: [['Gewerk','Berechnung','Ergebnis','Einheit','Beschreibung']],
          body: tableData,
          theme: 'grid',
          headStyles: {fillColor: [59,130,246],textColor: [255,255,255]},
          styles: {fontSize: 10}
        });

        yPos=doc.lastAutoTable.finalY + 15;
      });
    } else {
      doc.setFontSize(12);
      doc.text('Keine Messungen vorhanden',14,60);
    }

    // Add footer with page numbers
    const pageCount=doc.internal.getNumberOfPages();
    for (let i=1;i <=pageCount;i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Seite ${i} von ${pageCount}`,pageWidth - 20,doc.internal.pageSize.height - 10);
    }

    // Save the PDF
    doc.save(`Aufmaß_${project?.name || 'Projekt'}_${new Date().toLocaleDateString('de-DE')}.pdf`);
  };

  const exportToExcel=()=> {
    // Create workbook and worksheet
    const wb=XLSX.utils.book_new();

    // Project details sheet
    const projectDetails=[
      ['Aufmaß-Dokumentation'],
      [''],
      ['Projektdetails:'],
      ['Name',project?.name || 'Unbenannt'],
      ['Kunde',project?.customer || 'Nicht angegeben'],
      ['Adresse',project?.address || ''],
      ['Datum',new Date().toLocaleDateString('de-DE')]
    ];

    const wsProject=XLSX.utils.aoa_to_sheet(projectDetails);
    XLSX.utils.book_append_sheet(wb,wsProject,'Projektdetails');

    // Summary sheet
    const tradeSummary=calculateTradeSummary();
    const summaryData=[
      ['Gewerk','Summe','Einheit','Anzahl Messungen','Bereiche']
    ];

    tradeSummary.forEach(item=> {
      summaryData.push([
        item.trade,
        item.total.toFixed(2),
        item.unit,
        item.count,
        item.locations.join(',')
      ]);
    });

    const wsSummary=XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb,wsSummary,'Zusammenfassung');

    // Detailed measurements sheet
    const detailedData=[
      ['Etage','Raum','Gewerk','Berechnung','Ergebnis','Einheit','Beschreibung']
    ];

    measurements.forEach(m=> {
      detailedData.push([
        m.floor,
        m.room,
        m.trade,
        m.calculation,
        m.result,
        m.unit,
        m.description || ''
      ]);
    });

    const wsDetailed=XLSX.utils.aoa_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb,wsDetailed,'Detaillierte Messungen');

    // Set column widths for better readability
    const setCellWidths=(ws)=> {
      const colWidths=[
        {wch: 15},// Etage/Gewerk
        {wch: 15},// Raum/Summe
        {wch: 20},// Gewerk/Einheit
        {wch: 25},// Berechnung/Anzahl
        {wch: 10},// Ergebnis/Bereiche
        {wch: 10},// Einheit
        {wch: 30},// Beschreibung
      ];
      ws['!cols']=colWidths;
    };

    setCellWidths(wsProject);
    setCellWidths(wsSummary);
    setCellWidths(wsDetailed);

    // Generate Excel file
    const excelBuffer=XLSX.write(wb,{bookType: 'xlsx',type: 'array'});
    const blob=new Blob([excelBuffer],{type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(blob,`Aufmaß_${project?.name || 'Projekt'}_${new Date().toLocaleDateString('de-DE')}.xlsx`);
  };

  const groupedMeasurements=measurements.reduce((groups,measurement)=> {
    const key=`${measurement.floor}_${measurement.room}`;
    if (!groups[key]) {
      groups[key]={
        floor: measurement.floor,
        room: measurement.room,
        measurements: []
      };
    }
    groups[key].measurements.push(measurement);
    return groups;
  },{});

  const tradeSummary=calculateTradeSummary();

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
          <Link to={`/project/${id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aufmaß</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {measurements.length > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={()=> setShowExportOptions(!showExportOptions)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <SafeIcon icon={FiDownload} className="w-4 h-4" />
                  <span>Exportieren</span>
                </button>
                {showExportOptions && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={()=> {
                        exportToPDF();
                        setShowExportOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <SafeIcon icon={FiFileText} className="w-4 h-4" />
                      <span>Als PDF exportieren</span>
                    </button>
                    <button
                      onClick={()=> {
                        exportToExcel();
                        setShowExportOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <SafeIcon icon={FiFile} className="w-4 h-4" />
                      <span>Als Excel exportieren</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={()=> setShowSummary(!showSummary)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiBarChart3} className="w-4 h-4" />
                <span className="hidden sm:inline">Zusammenfassung</span>
                <span className="sm:hidden">Summen</span>
              </button>
            </>
          )}
          <button
            onClick={()=> {
              setEditingMeasurement(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center shadow-sm"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>Neue Messung</span>
          </button>
        </div>
      </div>

      {/* Zusammenfassung Section */}
      {showSummary && tradeSummary.length > 0 && (
        <motion.div
          initial={{opacity: 0,y: -20}}
          animate={{opacity: 1,y: 0}}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm border border-green-200 mb-6"
        >
          <div className="p-4 md:p-6 border-b border-green-200 bg-white bg-opacity-60">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <SafeIcon icon={FiSigma} className="w-5 h-5 mr-2 text-green-600" />
                Zusammenfassung aller Gewerke
              </h3>
              <button
                onClick={()=> setShowSummary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <SafeIcon icon={FiChevronDown} className="w-5 h-5 transform rotate-180" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Gesamtübersicht aller erfassten Messungen nach Gewerken
            </p>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tradeSummary.map((summary,index)=> (
                <motion.div
                  key={summary.trade}
                  initial={{opacity: 0,y: 20}}
                  animate={{opacity: 1,y: 0}}
                  transition={{delay: index * 0.1}}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm">{summary.trade}</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {summary.count} Mess.
                    </span>
                  </div>
                  <div className="text-center mb-3">
                    <p className="text-2xl font-bold text-green-600">
                      {summary.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">{summary.unit}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Erfasste Bereiche:</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.locations.slice(0,3).map((location,idx)=> (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {location}
                        </span>
                      ))}
                      {summary.locations.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          +{summary.locations.length - 3} weitere
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Gesamtstatistik */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-lg font-bold text-blue-600">{tradeSummary.length}</p>
                  <p className="text-xs text-gray-600">Gewerke</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-lg font-bold text-green-600">{measurements.length}</p>
                  <p className="text-xs text-gray-600">Messungen</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-lg font-bold text-purple-600">
                    {new Set(measurements.map(m=> `${m.floor}_${m.room}`)).size}
                  </p>
                  <p className="text-xs text-gray-600">Räume</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-lg font-bold text-orange-600">
                    {new Set(measurements.map(m=> m.floor)).size}
                  </p>
                  <p className="text-xs text-gray-600">Etagen</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {Object.keys(groupedMeasurements).length===0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <SafeIcon icon={FiCalculator} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Messungen vorhanden</h3>
          <p className="text-gray-600 mb-4">Erfassen Sie Ihre erste Messung,um zu beginnen.</p>
          <button
            onClick={()=> {
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
          {Object.values(groupedMeasurements).map((group,groupIndex)=> (
            <motion.div
              key={`${group.floor}_${group.room}`}
              initial={{opacity: 0,y: 20}}
              animate={{opacity: 1,y: 0}}
              transition={{delay: groupIndex * 0.1}}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <SafeIcon icon={FiClipboard} className="w-4 h-4 mr-2 text-blue-600" />
                    {group.floor} - {group.room}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {group.measurements.length} Messungen
                    </span>
                  </div>
                </div>
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
                    {group.measurements.map((measurement)=> (
                      <tr key={measurement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="font-medium">{measurement.trade}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {measurement.calculation}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {measurement.result} {measurement.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {measurement.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={()=> handleEditMeasurement(measurement)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                            >
                              <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={()=> handleDelete(measurement.id)}
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
            initial={{opacity: 0,scale: 0.95}}
            animate={{opacity: 1,scale: 1}}
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
                    onChange={(e)=> setFormData(prev=> ({...prev,floor: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wählen...</option>
                    {floors.map(floor=> (
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
                    onChange={(e)=> setFormData(prev=> ({...prev,room: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wählen...</option>
                    {rooms.map(room=> (
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
                    onClick={()=> setShowTradeDropdown(!showTradeDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                    disabled={editingMeasurement !==null}
                  >
                    <span className="text-left">
                      {formData.trades.length===0 
                        ? 'Gewerke auswählen...' 
                        : `${formData.trades.length} Gewerk(e) ausgewählt`}
                    </span>
                    <SafeIcon icon={FiChevronDown} className={`w-4 h-4 transition-transform ${showTradeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showTradeDropdown && !editingMeasurement && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {trades.map(trade=> (
                        <label key={trade.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.trades.includes(trade.name)}
                            onChange={()=> handleTradeToggle(trade.name)}
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
                    {formData.trades.map(tradeName=> (
                      <span key={tradeName} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tradeName}
                        {!editingMeasurement && (
                          <button
                            type="button"
                            onClick={()=> handleTradeToggle(tradeName)}
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
                    onChange={(e)=> setFormData(prev=> ({...prev,calculation: e.target.value}))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. (3.5 * 2.4) + (2.8 * 1.5)"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={()=> setShowCalculator(true)}
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
                    onChange={(e)=> setFormData(prev=> ({...prev,result: e.target.value}))}
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
                  onChange={(e)=> setFormData(prev=> ({...prev,description: e.target.value}))}
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
                  disabled={formData.trades.length===0}
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
          onClose={()=> setShowCalculator(false)}
        />
      )}
    </div>
  );
};

export default MeasurementModule;