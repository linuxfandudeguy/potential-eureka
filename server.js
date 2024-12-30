const express = require('express');
const crypto = require('crypto');
const { createCanvas } = require('canvas');

const app = express();
const PORT = 3000;

// Utility: Generate a hash from the seed
function hashSeed(seed) {
  return crypto.createHash('sha256').update(seed).digest();
}

// Utility: Get a color from the hash
function getColorFromHash(hash, index) {
  const r = hash[(index + 0) % hash.length];
  const g = hash[(index + 1) % hash.length];
  const b = hash[(index + 2) % hash.length];
  return `rgb(${r}, ${g}, ${b})`;
}

// Utility: Get a background color from the hash
function getBackgroundColor(hash) {
  const r = hash[0] % 128 + 128; // Bright colors
  const g = hash[1] % 128 + 128;
  const b = hash[2] % 128 + 128;
  return `rgb(${r}, ${g}, ${b})`;
}

// Generate an image based on the seed
function generatePattern(seed, filetype = 'png') {
  const hash = hashSeed(seed); // Get the hash of the seed
  const width = 500;
  const height = 500;

  // Create canvas and context for drawing
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background color based on the hash
  const backgroundColor = getBackgroundColor(hash);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  let shapeCount = 0;
  const maxShapes = 1000; // Maximum shapes to generate
  const gridSpacing = Math.sqrt((width * height) / maxShapes); // Calculate ideal spacing for even distribution

  // Draw random shapes on the canvas
  for (let y = 0; y < height; y += gridSpacing) {
    for (let x = 0; x < width; x += gridSpacing) {
      if (shapeCount >= maxShapes) break;

      // Offset the grid positions using the hash to avoid perfect alignment
      const offsetX = (hash[shapeCount % hash.length] % gridSpacing) - gridSpacing / 2;
      const offsetY = (hash[(shapeCount + 1) % hash.length] % gridSpacing) - gridSpacing / 2;

      const posX = Math.min(Math.max(0, x + offsetX), width); // Ensure within bounds
      const posY = Math.min(Math.max(0, y + offsetY), height); // Ensure within bounds

      const size = Math.abs(hash[(shapeCount + 2) % hash.length]) % 50 + 10; // Size between 10 and 60
      const color = getColorFromHash(hash, shapeCount);
      const shapeType = hash[(shapeCount + 3) % hash.length] % 3;

      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      console.log(
        `Generating shape #${shapeCount + 1}: Type ${shapeType} at (${posX.toFixed(1)}, ${posY.toFixed(
          1
        )}) with size ${size}`
      );

      // Draw the shape based on the type
      switch (shapeType) {
        case 0: // Circle
          ctx.beginPath();
          ctx.arc(posX, posY, size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 1: // Rectangle
          ctx.fillRect(posX - size / 2, posY - size / 2, size, size);
          break;
        case 2: // Line
          const endX = posX + size / 2;
          const endY = posY + size / 2;
          ctx.beginPath();
          ctx.moveTo(posX - size / 2, posY - size / 2);
          ctx.lineTo(endX, endY);
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        default:
          break;
      }

      shapeCount++;
    }
  }

  console.log('Finished generating shapes.');

  // Add patterns based on the hash
  if (hash[0] % 2 === 0) {
    const patternColor = getColorFromHash(hash, shapeCount);
    ctx.strokeStyle = patternColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + width, height);
      ctx.stroke();
    }
    console.log('Diagonal lines pattern added.');
  } else {
    const patternColor = getColorFromHash(hash, shapeCount);
    ctx.strokeStyle = patternColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    console.log('Grid pattern added.');
  }

  // Return the image in the requested format
  if (filetype === 'svg') {
    return canvas.toSVG();
  } else {
    return canvas.toBuffer();
  }
}

// API Endpoints
app.get('/api/:seed.:filetype', (req, res) => {
  const { seed, filetype } = req.params;
  try {
    const fileBuffer = generatePattern(seed, filetype);
    res.setHeader('Content-Type', `image/${filetype}`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error generating pattern:', error);
    res.status(500).json({ error: 'Error generating pattern' });
  }
});

app.get('/api/:seed.json', (req, res) => {
  const { seed } = req.params;
  const hash = hashSeed(seed).toString('hex');
  const imageUrl = `/api/${seed}.png`;
  res.json({ seed, hash, imageUrl });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
