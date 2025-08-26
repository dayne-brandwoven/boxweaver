import * as XLSX from 'xlsx';
import { Bin3D, findMaxCapacity } from './binPacking';

export async function processFile(file, dimensionTolerance, weightTolerance, onProgress) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);

  const itemsSheet = workbook.Sheets['Items'];
  const boxesSheet = workbook.Sheets['Boxes'];

  if (!itemsSheet || !boxesSheet) {
    throw new Error('Missing required sheets: Items and/or Boxes');
  }

  const items = XLSX.utils.sheet_to_json(itemsSheet);
  const boxes = XLSX.utils.sheet_to_json(boxesSheet);

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

export const processFile = async (file, dimensionTolerance, weightTolerance, setProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        setProgress(10);
        
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        setProgress(30);
        
        const itemsSheet = workbook.Sheets['Items'];
        const boxesSheet = workbook.Sheets['Boxes'];
        
        if (!itemsSheet || !boxesSheet) {
          throw new Error('Required sheets "Items" and "Boxes" not found');
        }
        
        const items = XLSX.utils.sheet_to_json(itemsSheet);
        const boxes = XLSX.utils.sheet_to_json(boxesSheet);
        
        setProgress(50);
        
        // Process each item against each box type
        const results = items.map(item => {
          const result = { SKU: item.SKU };
          
          boxes.forEach(box => {
            const capacity = calculateBoxCapacity(item, box, dimensionTolerance, weightTolerance);
            result[`Units_in_${box.BoxType}`] = capacity;
          });
          
          return result;
        });
        
        setProgress(100);
        resolve(results);
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
