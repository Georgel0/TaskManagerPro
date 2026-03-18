'use client';

export const generateIdenticonBase64 = (seed, size = 32) => {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return null;

  // DJB2 hashing function to get a number from the seed
  const djb2Hash = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
  };

  const hash = djb2Hash(seed);
  
  // Derive visual properties from the hash
  const hue = (hash % 360);
  const foregroundColor = `hsl(${hue}, 70%, 50%)`;
  const backgroundColor = '#ffffff';

  // Clear canvas with background color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Generate the 5x5 grid
  const gridSize = 5;
  const pixelSize = Math.floor(size / gridSize);
  const padding = (size - (gridSize * pixelSize)) / 2;

  ctx.fillStyle = foregroundColor;
  
  // Iterate through columns 0, 1, 2
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      // Create symmetry: columns 3 and 4 mirror 1 and 0
      const symmetryX = (x >= 3) ? (gridSize - 1 - x) : x;
      const index = symmetryX * gridSize + y;
      
      // Use the hash to fill deterministic squares
      if ((hash & (1 << index))) {
         ctx.fillRect(
          padding + x * pixelSize,
          padding + y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }

  // Return the canvas data as a base64 PNG
  return canvas.toDataURL("image/png");
};