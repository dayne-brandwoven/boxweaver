
import * as XLSX from 'xlsx';
import { Bin3D, findMaxCapacity } from './binPacking';

// Sanitize cell values to prevent formula injection
function sanitizeCell(value) {
  if (typeof value === 'string') {
    // Remove any formula indicators and potential dangerous characters
    const sanitized = value
      .replace(/^[=@+\-]/g, '') // Remove formula start characters
      .replace(/[\r\n\t]/g, '') // Remove control characters
      .trim();
    
    // If it was originally a formula, prefix with single quote to make it text
    if (value.match(/^[=@+\-]/)) {
      return `'${sanitized}`;
    }
    
    return sanitized;
  }
  return value;
}

// Validate cell values for expected data types
function validateCell(value, expectedType, fieldName) {
  const sanitized = sanitizeCell(value);
  
  switch (expectedType) {
    case 'string':
      if (typeof sanitized !== 'string' && sanitized !== undefined && sanitized !== null) {
        throw new Error(`${fieldName} must be text, got: ${typeof sanitized}`);
      }
      return String(sanitized || '');
      
    case 'number':
      const num = parseFloat(sanitized);
      if (isNaN(num) || num < 0) {
        throw new Error(`${fieldName} must be a positive number, got: ${sanitized}`);
      }
      return num;
      
    default:
      return sanitized;
  }
}

// Validate and sanitize row data
function validateAndSanitizeRow(row, schema, rowIndex) {
  const cleanRow = {};
  
  for (const [field, config] of Object.entries(schema)) {
    const rawValue = row[field];
    
    try {
      cleanRow[field] = validateCell(rawValue, config.type, `${field} (row ${rowIndex + 1})`);
      
      // Additional validation rules
      if (config.required && (cleanRow[field] === '' || cleanRow[field] == null)) {
        throw new Error(`${field} is required (row ${rowIndex + 1})`);
      }
      
      if (config.min !== undefined && cleanRow[field] < config.min) {
        throw new Error(`${field} must be at least ${config.min} (row ${rowIndex + 1})`);
      }
      
      if (config.max !== undefined && cleanRow[field] > config.max) {
        throw new Error(`${field} must be at most ${config.max} (row ${rowIndex + 1})`);
      }
      
    } catch (error) {
      throw new Error(`Validation error: ${error.message}`);
    }
  }
  
  return cleanRow;
}

export async function processFile(file, dimensionTolerance, weightTolerance, onProgress) {
  const data = await file.arrayBuffer();
  
  // Configure XLSX to not evaluate formulas and get raw values only
  const workbook = XLSX.read(data, {
    cellFormula: false, // Don't parse formulas
    cellHTML: false,    // Don't parse HTML
    cellNF: false,      // Don't parse number formats
    cellStyles: false,  // Don't parse styles
    sheetStubs: false,  // Don't include empty cells
    raw: false          // Parse values, not raw strings
  });

  const itemsSheet = workbook.Sheets['Items'];
  const boxesSheet = workbook.Sheets['Boxes'];

  if (!itemsSheet || !boxesSheet) {
    throw new Error('Missing required sheets: Items and/or Boxes');
  }

  // Convert sheets to JSON with formula protection
  const rawItems = XLSX.utils.sheet_to_json(itemsSheet, { defval: '' });
  const rawBoxes = XLSX.utils.sheet_to_json(boxesSheet, { defval: '' });

  // Check row limits
  if (rawItems.length > 1000) {
    throw new Error(`Too many items: ${rawItems.length} rows. Maximum allowed is 1000 rows.`);
  }

  if (rawBoxes.length > 1000) {
    throw new Error(`Too many boxes: ${rawBoxes.length} rows. Maximum allowed is 1000 rows.`);
  }

  // Define validation schemas
  const itemSchema = {
    SKU: { type: 'string', required: true },
    Height: { type: 'number', required: true, min: 0.1, max: 1000 },
    Width: { type: 'number', required: true, min: 0.1, max: 1000 },
    Length: { type: 'number', required: true, min: 0.1, max: 1000 },
    Weight: { type: 'number', required: true, min: 0.01, max: 10000 }
  };

  const boxSchema = {
    BoxType: { type: 'string', required: true },
    Height: { type: 'number', required: true, min: 0.1, max: 1000 },
    Width: { type: 'number', required: true, min: 0.1, max: 1000 },
    Length: { type: 'number', required: true, min: 0.1, max: 1000 },
    MaxWeight: { type: 'number', required: true, min: 0.1, max: 10000 }
  };

  // Validate and sanitize all data
  const items = rawItems.map((item, index) => 
    validateAndSanitizeRow(item, itemSchema, index)
  );
  
  const boxes = rawBoxes.map((box, index) => 
    validateAndSanitizeRow(box, boxSchema, index)
  );

  const totalOperations = items.length * boxes.length;
  let currentOperation = 0;

  const processedResults = [];

  for (const item of items) {
    const result = {
      SKU: item.SKU,
      Height: item.Height,
      Width: item.Width,
      Length: item.Length,
      Weight: item.Weight,
    };

    for (const box of boxes) {
      currentOperation++;
      if (onProgress) onProgress((currentOperation / totalOperations) * 100);

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
        weight: item.Weight,
      };

      const capacity = findMaxCapacity(adjustedBox, itemTemplate);
      result[`Units_in_${box.BoxType}`] = capacity;

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    processedResults.push(result);
  }

  if (onProgress) onProgress(100);

  return processedResults;
}
