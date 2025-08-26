import React, { useState } from 'react';
import { Upload, Download, Play, Box, FileSpreadsheet, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';
import { processFile } from '../utils/fileProcessor';

export default function BoxweaverCalculator() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [dimensionTolerance, setDimensionTolerance] = useState(0.5);
  const [weightTolerance, setWeightTolerance] = useState(0);

  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Nimbus Sans Extended Light';
        src: url('/fonts/NimbusSanExt-Lig.otf') format('opentype');
        font-weight: 300;
        font-style: normal;
        font-display: swap;
      }
      body { font-family: 'Nimbus Sans Extended Light', 'Nimbus Sans', Arial, sans-serif; }
    `;
    document.head.appendChild(style);
  }, []);

  const generateTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Items sheet
    const itemsData = [
      { SKU: 'ITEM001', Height: 10, Width: 8, Length: 12, Weight: 2.5 },
      { SKU: 'ITEM002', Height: 5, Width: 5, Length: 5, Weight: 0.5 },
    ];
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, itemsSheet, 'Items');

    // Boxes sheet
    const boxesData = [
      { BoxType: 'Small', Height: 9, Width: 12, Length: 9, MaxWeight: 50 },
      { BoxType: 'Medium', Height: 12, Width: 18, Length: 12, MaxWeight: 50 },
      { BoxType: 'Large', Height: 18, Width: 24, Length: 18, MaxWeight: 50 },
    ];
    const boxesSheet = XLSX.utils.json_to_sheet(boxesData);
    XLSX.utils.book_append_sheet(wb, boxesSheet, 'Boxes');

    // Download the file
    XLSX.writeFile(wb, 'box_capacity_template.xlsx');
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResults(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const processedResults = await processFile(
        file,
        dimensionTolerance,
        weightTolerance,
        setProgress
      );
      setResults(processedResults);
    } catch (error) {
      alert(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, 'Capacity_Results');
    XLSX.writeFile(wb, 'box_capacity_results.xlsx');
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#FEFEFB', fontFamily: "'Nimbus Sans Extended Light', 'Nimbus Sans', Arial, sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8" style={{ fontFamily: "'Nimbus Sans Extended Light', 'Nimbus Sans', Arial, sans-serif" }}>
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-3">
                <Box style={{ color: '#F5683A' }} size={40} />
                <h1 className="text-5xl font-bold" style={{ color: '#00435B', letterSpacing: '0.05em' }}>
                  BOXWEAVER
                </h1>
              </div>
              <svg 
                width="180" 
                height="24" 
                viewBox="0 0 194.02 25.41" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginTop: '8px' }}
              >
                <defs>
                  <style>
                    {`.cls-1 { fill: #f15a29; }
                     .cls-1, .cls-2, .cls-3, .cls-4 { stroke-width: 0px; }
                     .cls-2 { fill: #2e8068; }
                     .cls-3 { fill: #00435b; }
                     .cls-4 { fill: #001d27; }`}
                  </style>
                </defs>
                <g>
                  <g>
                    <g>
                      <path className="cls-3" d="M50.22,15.03c0,4.91-3.43,7.4-6.24,7.4-2.62,0-3.21-1.13-4.19-1.11-.89.03-1.65.92-2.46.92-.57,0-.76-.32-.67-.86.13-.76.22-1.65.22-2.7l-.03-11.18c0-1.86-1.27-1.67-1.27-2.48,0-.35.19-.54.84-.84,1.13-.54,3.08-1.19,3.51-1.19s.62.24.62.81l-.03,3.7v3.4c.86-1.13,2.21-1.94,4.05-1.97,3.1-.03,5.64,2.35,5.64,6.1ZM46.73,16.67c0-3.27-1.48-5.62-3.46-5.62-1.81,0-2.83,1.81-2.81,3.46l.03,1.97c0,2.43,1.54,4.27,3.43,4.27s2.81-1.92,2.81-4.08Z"/>
                      <path className="cls-3" d="M62.88,11.25c0,1.08-.57,1.78-1.32,1.81-1.32,0-1.27-1.4-2.56-1.4-.97,0-1.86,1.13-1.86,3.1v3.65c0,2.51,1.3,1.89,1.3,3.08,0,.54-.43.68-1.19.68h-3.86c-.76,0-1.24-.16-1.24-.7,0-1.16,1.35-.54,1.35-3.05v-5.13c0-.76-.3-1.24-.84-1.65-.27-.19-.51-.38-.51-.76,0-.43.22-.62.86-.92,1-.49,2.67-.97,3.1-1,.46,0,.65.27.65.81v1.59c1-1.65,2.43-2.43,3.73-2.43,1.54,0,2.4,1,2.4,2.32Z"/>
                      <path className="cls-3" d="M78.32,20.54c0,.92-1.49,1.84-2.78,1.84-1.19,0-1.89-.65-2.29-2-1.27,1.4-3.1,2.02-4.73,2.02-3,0-4.94-1.73-4.94-3.97,0-2.59,2.27-4.46,6.1-4.46.7,0,1.24.08,2.16.22-.49-1.7-1.03-3.05-3.05-3.05-1.22,0-2.32.51-3.29,1.05-.51.32-1.08-.08-.67-.76.67-1.13,2.73-2.51,5.32-2.51,3.46,0,4.48,2.38,5.08,4.62l1.32,5.08c.3,1.11.67,1.49,1.27,1.46.3,0,.51.14.51.46ZM72.79,18.35c-.08-.46-.32-1.13-.57-2.08-.19-.62-1.24-.89-2.11-.89-1.92,0-3.05.97-3.05,2.46.03,1.54,1.16,2.67,2.92,2.67,1.51,0,3.02-1.05,2.81-2.16Z"/>
                      <path className="cls-3" d="M94.47,19.1c.35,1.65,1.43,1.43,1.43,2.38,0,.54-.46.68-1.19.68h-3.78c-.76,0-1.21-.16-1.21-.7,0-.89,1.4-.81,1.05-2.57l-.84-4.27c-.32-1.7-.84-3.38-2.62-3.35-1.43,0-2.73,1.3-2.73,3.67v3.46c0,2.51,1.3,1.89,1.3,3.08,0,.54-.43.68-1.19.68h-3.86c-.76,0-1.24-.16-1.24-.7,0-1.16,1.35-.54,1.35-3.05v-5.13c0-.76-.3-1.24-.84-1.65-.27-.19-.51-.38-.51-.76,0-.43.22-.62.86-.92,1-.49,2.67-.97,3.1-1,.46,0,.65.27.65.81v1.62c1.03-1.62,2.67-2.46,4.4-2.46,3.08,0,4.24,2,4.94,5.56l.92,4.62Z"/>
                      <path className="cls-3" d="M109.99,7.49l-.05,10.58c0,2,1.59,1.57,1.59,2.35,0,.38-.27.65-.89,1-.78.41-2.32.95-3.08.95s-1.05-.46-1.13-1.59l-.03-.54c-.86,1.24-2.27,2.24-4.37,2.16-3.16-.05-5.4-2.51-5.4-5.99,0-4.67,3.67-7.48,6.83-7.48,1.11,0,2.11.27,2.86.7v-2.11c0-1.86-1.27-1.7-1.27-2.51,0-.35.19-.54.84-.84,1.13-.54,3.08-1.19,3.51-1.19s.62.24.62.81l-.03,3.7ZM106.32,17.08v-1.62c-.05-1.11-.22-2.21-.59-2.97-.57-1.24-1.51-1.86-2.7-1.86-1.84,0-2.92,1.62-2.92,4.13,0,3.32,1.65,5.32,3.51,5.32,1.62,0,2.54-1.35,2.7-3Z"/>
                      <path className="cls-3" d="M133,9.17c.76,0,1.21.16,1.21.7,0,1-1.08.62-2.02,2.81l-3.73,8.67c-.16.35-.35.65-1.38.84-.95.16-1.3.05-1.46-.41l-2.89-7.78-2.75,7.34c-.13.35-.54.65-1.3.84-1.03.24-1.38.05-1.57-.41l-3.65-9.07c-.86-2.21-1.97-1.84-1.97-2.86,0-.54.46-.68,1.19-.68h4.13c.76,0,1.24.16,1.24.7,0,1-1.57.62-.67,2.83l2.13,5.29,3.02-8.05c.13-.35.3-.62,1-.78.92-.22,1.24-.03,1.4.43l3.21,8.42,2.3-5.35c.92-2.19-.54-1.81-.54-2.84,0-.54.43-.68,1.16-.68h1.92Z"/>
                      <path className="cls-3" d="M134.48,16.19c0-4.05,3.16-7.26,7.45-7.26,3.73,0,6.29,2.75,6.29,6.35,0,4.08-3.1,7.16-7.4,7.16-3.59,0-6.35-2.4-6.35-6.24ZM144.63,17.16c0-3.13-1.59-6.45-3.92-6.45-1.94,0-2.67,1.84-2.67,3.75,0,3.16,1.62,6.18,3.94,6.18,1.84,0,2.65-1.62,2.65-3.48Z"/>
                      <path className="cls-3" d="M161.67,9.2c.78,0,1.24.16,1.24.68,0,1.03-1.13.65-1.97,2.86l-3.1,8.24c-.24.65-.41.92-1.76,1.22-1.46.35-1.84.11-2.08-.57l-3.51-8.91c-.86-2.19-1.97-1.81-1.97-2.83,0-.54.46-.68,1.19-.68h4.1c.76,0,1.22.16,1.22.68,0,1.03-1.54.65-.68,2.86l2.48,6.40,2.4-6.4c.81-2.21-.62-1.84-.62-2.86,0-.54.43-.68,1.19-.68h1.86Z"/>
                      <path className="cls-3" d="M175.95,18.7c-.54,1.51-2.78,3.73-6.37,3.73-3.83,0-6.43-2.65-6.43-6.35,0-4.16,3.21-7.16,6.99-7.16,3.24,0,5.1,1.94,5.48,4.27.08.43-.11.81-.62,1.05-2.75,1.24-4.94,2.08-7.75,3.1.57,1.24,1.81,2.46,3.89,2.46,1.65,0,2.97-.84,3.94-1.78.54-.54,1.13-.11.86.68ZM166.56,14.11c0,.59.08,1.24.22,1.7,1.57-.54,3.1-1.08,4.56-1.7.46-.22.81-.41.62-1.11-.38-1.57-1.7-2.54-3-2.3-1.57.19-2.4,1.67-2.4,3.4Z"/>
                      <path className="cls-3" d="M192.58,19.1c.35,1.65,1.43,1.43,1.43,2.38,0,.54-.46.68-1.19.68h-3.78c-.76,0-1.21-.16-1.21-.7,0-.89,1.4-.81,1.05-2.57l-.84-4.27c-.32-1.7-.84-3.38-2.62-3.35-1.43,0-2.73,1.3-2.73,3.67v3.46c0,2.51,1.3,1.89,1.3,3.08,0,.54-.43.68-1.19.68h-3.86c-.76,0-1.24-.16-1.24-.7,0-1.16,1.35-.54,1.35-3.05v-5.13c0-.76-.3-1.24-.84-1.65-.27-.19-.51-.38-.51-.76,0-.43.22-.62.86-.92,1-.49,2.67-.97,3.1-1,.46,0,.65.27.65.81v1.62c1.03-1.62,2.67-2.46,4.4-2.46,3.08,0,4.24,2,4.94,5.56l.92,4.62Z"/>
                    </g>
                    <g>
                      <path className="cls-1" d="M1.53,0h24.11v.17c0,8.9-7.22,16.12-16.12,16.12H0V1.53C0,.68.68,0,1.53,0Z"/>
                      <path className="cls-2" d="M6.58,9.13H0V1.53C0,.68.68,0,1.53,0h14.09v.09c0,4.99-1.61,9.03-9.03,9.03Z"/>
                      <path className="cls-3" d="M0,9.13h9.52c8.9,0,16.12,7.22,16.12,16.12v.17H1.53c-.84,0-1.53-.68-1.53-1.53v-14.76h0Z"/>
                      <path className="cls-4" d="M19.65,12.71c-2.77-2.24-6.29-3.58-10.13-3.58H0v7.16h9.52c3.84,0,7.36-1.34,10.13-3.58Z"/>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>

          {/* Instructions */}
          <div className="border rounded-lg p-6 mb-8" style={{ backgroundColor: '#E6F2F0', borderColor: '#2E8068' }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#00435B' }}>How to use:</h2>
            <ol className="space-y-2" style={{ color: '#00435B' }}>
              <li>1. Download the Excel template using the button below</li>
              <li>2. Fill in your item dimensions and weights in the "Items" sheet</li>
              <li>3. Define your box sizes and weight limits in the "Boxes" sheet</li>
              <li>4. Upload the completed template</li>
              <li>5. Click "Run Calculation" to process</li>
              <li>6. Download the results showing maximum units per box type</li>
            </ol>
          </div>

          {/* Tolerance Settings */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings size={20} />
              Packing Tolerances
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimension Tolerance (inches)
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={dimensionTolerance}
                  onChange={(e) => setDimensionTolerance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Reduces box dimensions for packing material</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight Tolerance (lbs)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={weightTolerance}
                  onChange={(e) => setWeightTolerance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Reduces max weight for safety margin</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={generateTemplate}
              className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: '#00435B', hover: { backgroundColor: '#003147' } }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#003147'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#00435B'}
            >
              <Download size={20} />
              Download Template
            </button>

            <label className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: '#2E8068' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#256B55'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2E8068'}
            >
              <Upload size={20} />
              Upload Excel File
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* File Status */}
          {file && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 flex items-center gap-2">
                <FileSpreadsheet size={20} />
                File loaded: {file.name}
              </p>
            </div>
          )}

          {/* Run Button */}
          {file && !isProcessing && (
            <button
              onClick={handleProcessFile}
              className="w-full flex items-center justify-center gap-2 text-white px-6 py-4 rounded-lg transition-colors text-lg font-semibold"
              style={{ backgroundColor: '#F5683A' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#E55529'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#F5683A'}
            >
              <Play size={24} />
              Run Calculation
            </button>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Results</h3>
                <button
                  onClick={downloadResults}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download size={18} />
                  Download Results
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                      {Object.keys(results[0]).filter(key => key.startsWith('Units_in_')).map(key => (
                        <th key={key} className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                          {key.replace('Units_in_', '')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-sm text-gray-800">{row.SKU}</td>
                        {Object.keys(row).filter(key => key.startsWith('Units_in_')).map(key => (
                          <td key={key} className="px-4 py-2 text-center text-sm text-gray-800">
                            {row[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-12 p-4 text-center text-sm" style={{ color: '#666', borderTop: '1px solid #E0E0E0' }}>
            <p>
              This tool is for informational purposes only. Accuracy is not guaranteed. 
              Please verify results and consider real-world packing constraints before making business decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
