// Initialize stage and layer for the grid
const stage = new Konva.Stage({
  container: 'grid',
  width: window.innerWidth * 0.6,
  height: window.innerHeight * 0.7,
  draggable: true, // Enable dragging
});

const layer = new Konva.Layer();
stage.add(layer);

let rows = 20;
let columns = 20;
let grid = Array.from({ length: rows }, () => Array(columns).fill(0)); // 2D matrix of dead cells (0)
const defaultCellSize = 30;

let simulationInterval;
let simulationSpeed = 500;

// Function to draw the grid
function drawGrid() {
  layer.destroyChildren(); // Clear previous grid

  const cellSize = Math.min(
      stage.width() / columns,
      stage.height() / rows
  ); // Ensure square cells

  for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
          const cellState = grid[row][col];
          const cell = new Konva.Rect({
              x: col * cellSize,
              y: row * cellSize,
              width: cellSize,
              height: cellSize,
              fill: cellState ? '#FFD700' : null, // Glowing yellow for live cells
              stroke: '#AAA',
              strokeWidth: 0.5,
          });

          // Add click event for toggling cell state
          cell.on('click', () => {
              grid[row][col] = grid[row][col] === 0 ? 1 : 0; // Toggle cell state
              drawGrid(); // Redraw grid to reflect changes
          });

          layer.add(cell);
      }
  }

  layer.draw();
}

drawGrid();

// Function to update the grid dynamically
function updateGrid(newRows, newColumns) {
  rows = newRows;
  columns = newColumns;

  // Adjust the grid size
  grid = Array.from({ length: rows }, () => Array(columns).fill(0));

  drawGrid(); // Redraw the grid
}

// Event listener for updating grid size
document.getElementById('gridForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const newRows = parseInt(document.getElementById('rows').value, 10) || rows;
  const newColumns = parseInt(document.getElementById('columns').value, 10) || columns;

  updateGrid(newRows, newColumns);
});

// Zoom controls
const scaleBy = 1.1;

function zoomStage(scaleFactor) {
  const oldScale = stage.scaleX();
  const newScale = scaleFactor > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  const pointer = stage.getPointerPosition();
  const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
  };

  stage.scale({ x: newScale, y: newScale });

  const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);
  stage.batchDraw();
}

// Button controls
document.getElementById('zoomIn').addEventListener('click', () => zoomStage(1));
document.getElementById('zoomOut').addEventListener('click', () => zoomStage(-1));

// Mouse wheel zoom
stage.on('wheel', (e) => {
  e.evt.preventDefault();
  zoomStage(e.evt.deltaY > 0 ? -1 : 1);
});

// Grid dragging using right mouse button
let isDragging = false;
let startPos;

stage.on('mousedown', (e) => {
  if (e.evt.button === 2) { // Right mouse button
      isDragging = true;
      startPos = stage.getPointerPosition();
      e.evt.preventDefault();
  }
});

stage.on('mousemove', (e) => {
  if (!isDragging) return;
  const pos = stage.getPointerPosition();
  const dx = pos.x - startPos.x;
  const dy = pos.y - startPos.y;

  stage.position({
      x: stage.x() + dx,
      y: stage.y() + dy,
  });
  stage.batchDraw();
  startPos = pos;
});

stage.on('mouseup', () => {
  isDragging = false;
});

stage.container().addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Responsive resizing
window.addEventListener('resize', () => {
  stage.width(window.innerWidth * 0.6);
  stage.height(window.innerHeight * 0.7);
  drawGrid();
});

// Start Simulation
function startSimulation() {
    stopSimulation(); // Ensure no duplicate intervals

    simulationInterval = setInterval(() => {
        const nextGrid = grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
              let liveNeighbors = 0;

              // Count live neighbors
              for (let dr = -1; dr <= 1; dr++) {
                  for (let dc = -1; dc <= 1; dc++) {
                      if (dr === 0 && dc === 0) continue;
                      const neighborRow = rowIndex + dr;
                      const neighborCol = colIndex + dc;
                      if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < columns) {
                          liveNeighbors += grid[neighborRow][neighborCol];
                      }
                  }
              }

              // Game of Life rules
              if (cell === 1 && (liveNeighbors < 2 || liveNeighbors > 3)) {
                  return 0; // Cell dies
              }
              if (cell === 0 && liveNeighbors === 3) {
                  return 1; // Cell comes to life
              }
              return cell; // Cell remains the same
          })
        );

        grid = nextGrid; // Update grid state
        drawGrid(); // Redraw grid
    }, simulationSpeed);
}

// Stop Simulation
function stopSimulation() {
    clearInterval(simulationInterval);
}

// Randomize Grid
function randomizeGrid() {
    grid = grid.map(row => row.map(() => (Math.random() > 0.7 ? 1 : 0)));
    drawGrid();
}

// Reset Grid
function resetGrid() {
    grid = Array.from({ length: rows }, () => Array(columns).fill(0));
    drawGrid();
}

// Event Listeners
document.getElementById('startSimulation').addEventListener('click', () => {
    document.getElementById('startSimulation').disabled = true;
    document.getElementById('stopSimulation').disabled = false;
    startSimulation();
});

document.getElementById('stopSimulation').addEventListener('click', () => {
    document.getElementById('startSimulation').disabled = false;
    document.getElementById('stopSimulation').disabled = true;
    stopSimulation();
});

document.getElementById('simulationSpeed').addEventListener('change', (e) => {
    simulationSpeed = parseInt(e.target.value, 10);
    if (simulationInterval) {
        stopSimulation();
        startSimulation();
    }
});

document.getElementById('resetGrid').addEventListener('click', resetGrid);
document.getElementById('randomizeGrid').addEventListener('click', randomizeGrid);
