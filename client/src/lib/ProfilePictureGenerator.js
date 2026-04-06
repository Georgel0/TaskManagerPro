'use client';

/**
 * Generates a deterministic, symmetric identicon as a Base64 PNG.
 * * Logic:
 * 1. Hashes the seed string into a 32-bit integer.
 * 2. Uses the hash to derive a unique HSL color.
 * 3. Maps the hash bits to a 7x7 grid, mirroring the left side to the right
 * to create horizontal symmetry.
 */
export const generateIdenticonBase64 = (seed, size = 128) => {
  // Prevent execution during SSR (Server Side Rendering)
  if (typeof window === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  /**
   * Implementation of the FNV-1a hash algorithm.
   * Provides a fast, non-cryptographic way to turn a string into a 
   * distributed 32-bit unsigned integer.
   */
  const getHash = (str) => {
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      // Math.imul performs 32-bit integer multiplication (mimics C-style)
      hash = Math.imul(hash, 16777619); // FNV prime
    }
    return hash >>> 0; // Convert to unsigned 32-bit integer
  };

  const hash = getHash(seed);

  /**
   * Color Generation:
   * Hue: Full 360-degree spectrum.
   * Saturation: Kept between 50-80% for vibrancy.
   * Lightness: Kept between 45-60% to ensure contrast against white background.
   */
  const hue = hash % 360;
  const saturation = 50 + (hash % 30);
  const lightness = 45 + (hash % 15);
  const primaryColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  const gridSize = 7;
  const cellSize = size / gridSize;
  const mid = Math.ceil(gridSize / 2); // The center column index

  // Initialize background to solid white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Set active drawing color to the generated primary color
  ctx.fillStyle = primaryColor;

  // Iterate through the 7x7 grid
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      /**
       * Symmetric Mapping:
       * If 'x' is beyond the midpoint, we use the mirrored 'x' value 
       * from the left side. This ensures columns 5, 6, and 7 
       * match columns 3, 2, and 1.
       */
      const sourceX = x >= mid ? gridSize - 1 - x : x;
      
      /**
       * Bitwise Pattern Determination:
       * 1. Create a unique ID for the cell based on its (mirrored) coordinates.
       * 2. Shift the hash bits based on that ID.
       * 3. Use a bitwise AND (& 1) to check if the last bit is 1 (Filled) or 0 (Empty).
       * Note: % 31 keeps the shift within the bounds of a 32-bit integer.
       */
      const cellId = (sourceX * gridSize) + y;
      const isFilled = ((hash >> (cellId % 31)) & 1) === 1;

      if (isFilled) {
        /**
         * Drawing with Pixel-Perfect Alignment:
         * Math.floor and Math.ceil are used to ensure that even with 
         * non-integer cell sizes, there are no "anti-aliased" gaps 
         * between the squares.
         */
        ctx.fillRect(
          Math.floor(x * cellSize),
          Math.floor(y * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }

  // Export the canvas buffer as a Base64 encoded PNG string
  return canvas.toDataURL("image/png");
};