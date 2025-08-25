import React, { useState, useCallback } from 'react';
import { Upload, Download, Play, Box, FileSpreadsheet, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';

// 3D Bin Packing Implementation
class Item3D {
  constructor(name, width, height, depth, weight) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.weight = weight;
    this.position = null;
    this.rotationType = 0;
  }

  getDimension(axis) {
    const dimensions = [this.width, this.height, this.depth];
    const rotations = [
      [0, 1, 2], // No rotation
      [0, 2, 1], // Rotate around X
      [1, 0, 2], // Rotate around Y
      [1, 2, 0], // Rotate around X then Y
      [2, 0, 1], // Rotate around Z
      [2, 1, 0]  // Rotate around Z then Y
    ];

    const rotation = rotations[this.rotationType];
    return dimensions[rotation[axis]];
  }

  getWidth() { return this.getDimension(0); }
  getHeight() { return this.getDimension(1); }
  getDepth() { return this.getDimension(2); }
}

class Position {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Bin3D {
  constructor(name, width, height, depth, maxWeight) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.maxWeight = maxWeight;
    this.items = [];
    this.currentWeight = 0;
  }

  reset() {
    this.items = [];
    this.currentWeight = 0;
  }

  canAddItem(item) {
    return this.currentWeight + item.weight <= this.maxWeight;
  }

  findBestPosition(item) {
    if (!this.canAddItem(item)) return null;

    // Try all rotation types
    for (let rotation = 0; rotation < 6; rotation++) {
      item.rotationType = rotation;

      // Get item dimensions after rotation
      const itemWidth = item.getWidth();
      const itemHeight = item.getHeight();
      const itemDepth = item.getDepth();

      // Check if item fits in bin dimensions
      if (itemWidth > this.width || itemHeight > this.height || itemDepth > this.depth) {
        continue;
      }

      // Find all possible positions
      const positions = this.getPossiblePositions(itemWidth, itemHeight, itemDepth);

      // Find the best position (lowest and most to the back-left)
      let bestPosition = null;
      let minY = Infinity;

      for (const pos of positions) {
        if (this.canPlaceItem(pos, itemWidth, itemHeight, itemDepth)) {
          if (pos.y < minY || (pos.y === minY && (pos.z < bestPosition.z || (pos.z === bestPosition.z && pos.x < bestPosition.x)))) {
            bestPosition = pos;
            minY = pos.y;
          }
        }
      }

      if (bestPosition) {
        item.position = bestPosition;
        return true;
      }
    }

    return false;
  }

  getPossiblePositions(itemWidth, itemHeight, itemDepth) {
    const positions = [new Position(0, 0, 0)]; // Always try origin

    // Add positions based on existing items
    for (const placedItem of this.items) {
      const x = placedItem.position.x;
      const y = placedItem.position.y;
      const z = placedItem.position.z;
      const w = placedItem.getWidth();
      const h = placedItem.getHeight();
      const d = placedItem.getDepth();

      // Try positions adjacent to each placed item
      positions.push(new Position(x + w, y, z)); // Right
      positions.push(new Position(x, y + h, z)); // Top
      positions.push(new Position(x, y, z + d)); // Front
    }

    // Filter positions that are within bin bounds
    return positions.filter(pos => 
      pos.x + itemWidth <= this.width &&
      pos.y + itemHeight <= this.height &&
      pos.z + itemDepth <= this.depth
    );
  }

  canPlaceItem(position, width, height, depth) {
    // Check if the item overlaps with any existing items
    for (const item of this.items) {
      if (this.intersects(
        position.x, position.y, position.z, width, height, depth,
        item.position.x, item.position.y, item.position.z,
        item.getWidth(), item.getHeight(), item.getDepth()
      )) {
        return false;
      }
    }
    return true;
  }

  intersects(x1, y1, z1, w1, h1, d1, x2, y2, z2, w2, h2, d2) {
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 ||
             y1 + h1 <= y2 || y2 + h2 <= y1 ||
             z1 + d1 <= z2 || z2 + d2 <= z1);
  }

  addItem(item) {
    if (this.findBestPosition(item)) {
      this.items.push(item);
      this.currentWeight += item.weight;
      return true;
    }
    return false;
  }
}

// Binary search to find maximum items that fit
function findMaxCapacity(bin, itemTemplate, maxAttempts = 1000) {
  let low = 0;
  let high = maxAttempts;
  let bestFit = 0;

  // First check weight constraint
  const maxByWeight = Math.floor(bin.maxWeight / itemTemplate.weight);
  high = Math.min(high, maxByWeight);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    bin.reset();

    let allFit = true;
    for (let i = 0; i < mid; i++) {
      const item = new Item3D(
        `${itemTemplate.name}_${i}`,
        itemTemplate.width,
        itemTemplate.height,
        itemTemplate.depth,
        itemTemplate.weight
      );

      if (!bin.addItem(item)) {
        allFit = false;
        break;
      }
    }

    if (allFit) {
      bestFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestFit;
}

// Main component
export default function BoxCapacityCalculator() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [dimensionTolerance, setDimensionTolerance] = useState(0.5);
  const [weightTolerance, setWeightTolerance] = useState(0);

  // Add Nimbus Sans Extended font
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Nimbus+Sans:wght@400&display=swap');
      body { font-family: 'Nimbus Sans', sans-serif; }
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
      { BoxType: 'Small', Height: 20, Width: 15, Length: 25, MaxWeight: 30 },
      { BoxType: 'Medium', Height: 30, Width: 25, Length: 35, MaxWeight: 50 },
      { BoxType: 'Large', Height: 40, Width: 35, Length: 45, MaxWeight: 70 },
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

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Read the file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Extract data from sheets
      const itemsSheet = workbook.Sheets['Items'];
      const boxesSheet = workbook.Sheets['Boxes'];

      if (!itemsSheet || !boxesSheet) {
        throw new Error('Missing required sheets: Items and/or Boxes');
      }

      const items = XLSX.utils.sheet_to_json(itemsSheet);
      const boxes = XLSX.utils.sheet_to_json(boxesSheet);

      const totalOperations = items.length * boxes.length;
      let currentOperation = 0;

      // Process each item
      const processedResults = [];

      for (const item of items) {
        const result = {
          SKU: item.SKU,
          Height: item.Height,
          Width: item.Width,
          Length: item.Length,
          Weight: item.Weight,
        };

        // Calculate capacity for each box type
        for (const box of boxes) {
          currentOperation++;
          setProgress((currentOperation / totalOperations) * 100);

          // Apply tolerances
          const adjustedBox = new Bin3D(
            box.BoxType,
            box.Width - dimensionTolerance,
            box.Height - dimensionTolerance,
            box.Length - dimensionTolerance,
            box.MaxWeight - weightTolerance
          );

          const itemTemplate = {
            name: item.SKU,
            width: item.Width,
            height: item.Height,
            depth: item.Length,
            weight: item.Weight
          };

          // Find maximum capacity using binary search
          const capacity = findMaxCapacity(adjustedBox, itemTemplate);
          result[`Units_in_${box.BoxType}`] = capacity;

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        processedResults.push(result);
      }

      setResults(processedResults);
      setProgress(100);
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
    <div className="min-h-screen p-8" style={{ backgroundColor: '#FEFEFB', fontFamily: 'Nimbus Sans, Arial, sans-serif' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8" style={{ fontFamily: 'Nimbus Sans, Arial, sans-serif' }}>
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
                height="30" 
                viewBox="0 0 180 30" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginTop: '8px' }}
              >
                {/* Simplified Brandwoven logo */}
                <path d="M10 8C6 8 4 10 4 14V16C4 20 6 22 10 22H14C18 22 20 20 20 16V14C20 10 18 8 14 8H10Z" fill="#00435B"/>
                <path d="M4 8H10C14 8 16 10 16 14" stroke="#F5683A" strokeWidth="2" fill="none"/>
                <text x="28" y="18" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="600" fill="#00435B">brandwoven</text>
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
              onClick={processFile}
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
