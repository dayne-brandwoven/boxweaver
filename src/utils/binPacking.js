export class Item3D {
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
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0]
    ];
    const rotation = rotations[this.rotationType];
    return dimensions[rotation[axis]];
  }

  getWidth() { return this.getDimension(0); }
  getHeight() { return this.getDimension(1); }
  getDepth() { return this.getDimension(2); }
}

export class Position {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Bin3D {
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

    for (let rotation = 0; rotation < 6; rotation++) {
      item.rotationType = rotation;

      const itemWidth = item.getWidth();
      const itemHeight = item.getHeight();
      const itemDepth = item.getDepth();

      if (itemWidth > this.width || itemHeight > this.height || itemDepth > this.depth) {
        continue;
      }

      const positions = this.getPossiblePositions(itemWidth, itemHeight, itemDepth);

      let bestPosition = null;
      let minY = Infinity;

      for (const pos of positions) {
        if (this.canPlaceItem(pos, itemWidth, itemHeight, itemDepth)) {
          if (
            pos.y < minY ||
            (pos.y === minY &&
              (bestPosition === null ||
                pos.z < bestPosition.z ||
                (pos.z === bestPosition.z && pos.x < bestPosition.x)))
          ) {
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
    const positions = [new Position(0, 0, 0)];

    for (const placedItem of this.items) {
      const x = placedItem.position.x;
      const y = placedItem.position.y;
      const z = placedItem.position.z;
      const w = placedItem.getWidth();
      const h = placedItem.getHeight();
      const d = placedItem.getDepth();

      positions.push(new Position(x + w, y, z));
      positions.push(new Position(x, y + h, z));
      positions.push(new Position(x, y, z + d));
    }

    return positions.filter(
      pos =>
        pos.x + itemWidth <= this.width &&
        pos.y + itemHeight <= this.height &&
        pos.z + itemDepth <= this.depth
    );
  }

  canPlaceItem(position, width, height, depth) {
    for (const item of this.items) {
      if (
        this.intersects(
          position.x,
          position.y,
          position.z,
          width,
          height,
          depth,
          item.position.x,
          item.position.y,
          item.position.z,
          item.getWidth(),
          item.getHeight(),
          item.getDepth()
        )
      ) {
        return false;
      }
    }
    return true;
  }

  intersects(x1, y1, z1, w1, h1, d1, x2, y2, z2, w2, h2, d2) {
    return !(
      x1 + w1 <= x2 ||
      x2 + w2 <= x1 ||
      y1 + h1 <= y2 ||
      y2 + h2 <= y1 ||
      z1 + d1 <= z2 ||
      z2 + d2 <= z1
    );
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

export function findMaxCapacity(bin, itemTemplate, maxAttempts = 1000) {
  let low = 0;
  let high = maxAttempts;
  let bestFit = 0;

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

export const calculateBoxCapacity = (item, box, dimensionTolerance = 0, weightTolerance = 0) => {
  // Apply tolerances to box dimensions and weight
  const adjustedBoxHeight = box.Height - dimensionTolerance;
  const adjustedBoxWidth = box.Width - dimensionTolerance;
  const adjustedBoxLength = box.Length - dimensionTolerance;
  const adjustedMaxWeight = box.MaxWeight - weightTolerance;
  
  // Check if item dimensions are valid
  if (item.Height <= 0 || item.Width <= 0 || item.Length <= 0 || item.Weight <= 0) {
    return 0;
  }
  
  // Check if item can fit in box at all
  if (item.Height > adjustedBoxHeight || 
      item.Width > adjustedBoxWidth || 
      item.Length > adjustedBoxLength ||
      item.Weight > adjustedMaxWeight) {
    return 0;
  }
  
  // Calculate how many items can fit in each dimension
  const unitsHeight = Math.floor(adjustedBoxHeight / item.Height);
  const unitsWidth = Math.floor(adjustedBoxWidth / item.Width);
  const unitsLength = Math.floor(adjustedBoxLength / item.Length);
  
  // Calculate total units that can fit by volume
  const unitsByVolume = unitsHeight * unitsWidth * unitsLength;
  
  // Calculate units that can fit by weight
  const unitsByWeight = Math.floor(adjustedMaxWeight / item.Weight);
  
  // Return the minimum (limiting factor)
  return Math.min(unitsByVolume, unitsByWeight);
};
