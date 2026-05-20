// src/components/GameCanvas.jsx
import React, { useRef, useEffect, useState } from 'react';
import { playPlace, playRotate, playTargetLock, playLevelUp } from '../utils/audio';

const COLORS = {
  red: '#ff0055',
  green: '#00ff87',
  blue: '#007fff',
  white: '#ffffff',
  yellow: '#ffdf00',
  magenta: '#ff00ff',
  cyan: '#00ffff'
};

function GameCanvas({ level, onLevelClear, onQuit }) {
  const canvasRef = useRef(null);
  const [selectedBlock, setSelectedBlock] = useState(null); // 'mirror' | 'prism' | 'filter-red' | 'filter-green' | 'filter-blue'
  const [inventory, setInventory] = useState({
    mirror: 0,
    prism: 0,
    'filter-red': 0,
    'filter-green': 0,
    'filter-blue': 0
  });

  const stateRef = useRef({
    cols: 10,
    rows: 8,
    grid: [], // 2D array: null or { type, rotation } (rotation: 0, 90, 180, 270)
    emitters: [], // { col, row, dir: 'R'|'L'|'U'|'D', color: 'red'|'green'|'blue'|'white' }
    receptors: [], // { col, row, color: 'red'|'yellow'|'green'|..., activeColor: null }
    beams: [], // [{ points: [{x,y}], color }]
    clearPending: false
  });

  const loadLevel = (lvl) => {
    const state = stateRef.current;
    state.clearPending = false;
    state.grid = Array.from({ length: state.rows }, () => Array(state.cols).fill(null));
    state.emitters = [];
    state.receptors = [];
    state.beams = [];

    // Define inventory and map components for levels
    let inv = { mirror: 0, prism: 0, 'filter-red': 0, 'filter-green': 0, 'filter-blue': 0 };

    switch(lvl) {
      case 1:
        // Basic Mirror tutorial
        inv.mirror = 2;
        state.emitters.push({ col: 1, row: 1, dir: 'R', color: 'red' });
        state.receptors.push({ col: 8, row: 5, color: 'red', activeColor: null });
        break;

      case 2:
        // Filter tutorial: make white laser green
        inv['filter-green'] = 1;
        inv.mirror = 1;
        state.emitters.push({ col: 1, row: 2, dir: 'R', color: 'white' });
        state.receptors.push({ col: 7, row: 5, color: 'green', activeColor: null });
        break;

      case 3:
        // Double mirrors: zig-zag
        inv.mirror = 3;
        state.emitters.push({ col: 1, row: 6, dir: 'U', color: 'blue' });
        state.receptors.push({ col: 8, row: 1, color: 'blue', activeColor: null });
        break;

      case 4:
        // Color mix: Red + Green = Yellow
        inv.mirror = 3;
        state.emitters.push({ col: 1, row: 1, dir: 'R', color: 'red' });
        state.emitters.push({ col: 1, row: 6, dir: 'R', color: 'green' });
        state.receptors.push({ col: 8, row: 4, color: 'yellow', activeColor: null });
        break;

      case 5:
        // Prism splitting: white splits into RGB
        inv.prism = 1;
        inv.mirror = 3;
        state.emitters.push({ col: 1, row: 3, dir: 'R', color: 'white' });
        state.receptors.push({ col: 5, row: 1, color: 'red', activeColor: null });
        state.receptors.push({ col: 8, row: 3, color: 'green', activeColor: null });
        state.receptors.push({ col: 5, row: 6, color: 'blue', activeColor: null });
        break;

      case 6:
        // Filter-Red + Filter-Blue mixing logic
        inv['filter-red'] = 1;
        inv['filter-blue'] = 1;
        inv.mirror = 4;
        state.emitters.push({ col: 1, row: 1, dir: 'R', color: 'white' });
        state.emitters.push({ col: 1, row: 6, dir: 'R', color: 'white' });
        state.receptors.push({ col: 8, row: 3, color: 'magenta', activeColor: null });
        break;

      case 7:
        // Prism + mirrors zig-zag challenge
        inv.prism = 1;
        inv.mirror = 5;
        state.emitters.push({ col: 0, row: 4, dir: 'R', color: 'white' });
        state.receptors.push({ col: 3, row: 1, color: 'red', activeColor: null });
        state.receptors.push({ col: 7, row: 7, color: 'blue', activeColor: null });
        break;

      case 8:
        // Triangle crossing: 3 different color receptors
        inv.mirror = 4;
        inv['filter-red'] = 1;
        inv['filter-green'] = 1;
        state.emitters.push({ col: 1, row: 1, dir: 'R', color: 'white' });
        state.emitters.push({ col: 8, row: 6, dir: 'L', color: 'green' });
        state.receptors.push({ col: 5, row: 1, color: 'red', activeColor: null });
        state.receptors.push({ col: 5, row: 6, color: 'green', activeColor: null });
        break;

      case 9:
        // Cyan and yellow combination
        inv.mirror = 4;
        inv['filter-blue'] = 1;
        inv['filter-green'] = 1;
        state.emitters.push({ col: 1, row: 1, dir: 'R', color: 'white' });
        state.emitters.push({ col: 1, row: 6, dir: 'R', color: 'red' });
        state.receptors.push({ col: 8, row: 3, color: 'cyan', activeColor: null });
        state.receptors.push({ col: 5, row: 6, color: 'yellow', activeColor: null });
        break;

      case 10:
        // Ultimate Prism Matrix: RGBYCM mix
        inv.prism = 2;
        inv.mirror = 6;
        inv['filter-red'] = 1;
        inv['filter-green'] = 1;
        state.emitters.push({ col: 0, row: 3, dir: 'R', color: 'white' });
        state.emitters.push({ col: 9, row: 4, dir: 'L', color: 'white' });
        state.receptors.push({ col: 4, row: 1, color: 'magenta', activeColor: null });
        state.receptors.push({ col: 4, row: 6, color: 'yellow', activeColor: null });
        break;

      default:
        inv.mirror = 2;
        state.emitters.push({ col: 1, row: 1, dir: 'R', color: 'red' });
        state.receptors.push({ col: 8, row: 5, color: 'red', activeColor: null });
        break;
    }

    setInventory(inv);
    setSelectedBlock(null);
  };

  const getOppositeDir = (dir) => {
    if (dir === 'R') return 'L';
    if (dir === 'L') return 'R';
    if (dir === 'U') return 'D';
    return 'U';
  };

  const calculateLasers = () => {
    const state = stateRef.current;
    state.beams = [];
    
    // Reset receptor active colors
    state.receptors.forEach(r => r.activeColor = null);

    // Keep track of colors hitting receptors as sets
    const receptorHits = Array.from({ length: state.receptors.length }, () => new Set());

    // Trace list of beams
    const traceBeam = (startCol, startRow, startDir, startColor) => {
      let col = startCol;
      let row = startRow;
      let dir = startDir;
      let color = startColor;

      let points = [];
      let steps = 0;
      const maxSteps = 40; // prevent infinite loops

      // Add emitter center as first point
      points.push({ col, row });

      while (steps < maxSteps) {
        steps++;
        // Move next
        if (dir === 'R') col++;
        else if (dir === 'L') col--;
        else if (dir === 'U') row--;
        else if (dir === 'D') row++;

        // Bound check
        if (col < 0 || col >= state.cols || row < 0 || row >= state.rows) {
          points.push({ col, row });
          break;
        }

        // Add current point
        points.push({ col, row });

        // Check if hit a receptor
        const recIdx = state.receptors.findIndex(r => r.col === col && r.row === row);
        if (recIdx !== -1) {
          // Ray terminates and feeds the target
          receptorHits[recIdx].add(color);
          break;
        }

        // Check grid elements
        const cell = state.grid[row][col];
        if (cell) {
          if (cell.type === 'mirror') {
            // Mirror logic based on rotation
            // rotation = 0: diagonal pointing / (bottom-left to top-right)
            // rotation = 90: diagonal pointing \ (top-left to bottom-right)
            const rot = cell.rotation;
            if (rot === 0) {
              if (dir === 'R') { dir = 'U'; }
              else if (dir === 'L') { dir = 'D'; }
              else if (dir === 'U') { dir = 'R'; }
              else if (dir === 'D') { dir = 'L'; }
            } else if (rot === 90) {
              if (dir === 'R') { dir = 'D'; }
              else if (dir === 'L') { dir = 'U'; }
              else if (dir === 'U') { dir = 'L'; }
              else if (dir === 'D') { dir = 'R'; }
            } else if (rot === 180) { // Same as 0
              if (dir === 'R') { dir = 'U'; }
              else if (dir === 'L') { dir = 'D'; }
              else if (dir === 'U') { dir = 'R'; }
              else if (dir === 'D') { dir = 'L'; }
            } else { // 270: Same as 90
              if (dir === 'R') { dir = 'D'; }
              else if (dir === 'L') { dir = 'U'; }
              else if (dir === 'U') { dir = 'L'; }
              else if (dir === 'D') { dir = 'R'; }
            }
          } 
          else if (cell.type === 'prism') {
            // Prism splits White into R, G, B channels
            if (color === 'white') {
              // Trace three split beams in perpendicular directions relative to entry
              if (dir === 'R' || dir === 'L') {
                traceBeam(col, row, 'U', 'red');
                traceBeam(col, row, dir, 'green');
                traceBeam(col, row, 'D', 'blue');
              } else {
                traceBeam(col, row, 'L', 'red');
                traceBeam(col, row, dir, 'green');
                traceBeam(col, row, 'R', 'blue');
              }
            } else {
              // Pass colored laser straight through
              // no change in direction or color
            }
            break; // Ray terminates inside prism to spawn split sub-rays
          } 
          else if (cell.type.startsWith('filter-')) {
            const filterColor = cell.type.split('-')[1]; // 'red' | 'green' | 'blue'
            if (color === 'white') {
              color = filterColor;
            } else if (color !== filterColor) {
              // absorbed/blocked
              break;
            }
          }
        }
      }

      state.beams.push({ points, color });
    };

    // Trigger tracing from all emitters
    state.emitters.forEach(em => {
      traceBeam(em.col, em.row, em.dir, em.color);
    });

    // Solve combined colors for receptors
    state.receptors.forEach((r, idx) => {
      const hits = Array.from(receptorHits[idx]);
      if (hits.length === 0) {
        r.activeColor = null;
      } else if (hits.length === 1) {
        r.activeColor = hits[0];
      } else {
        // Blend overlapping light spectra
        const hasRed = hits.includes('red') || hits.includes('white') || hits.includes('yellow') || hits.includes('magenta');
        const hasGreen = hits.includes('green') || hits.includes('white') || hits.includes('yellow') || hits.includes('cyan');
        const hasBlue = hits.includes('blue') || hits.includes('white') || hits.includes('magenta') || hits.includes('cyan');

        if (hasRed && hasGreen && hasBlue) r.activeColor = 'white';
        else if (hasRed && hasGreen) r.activeColor = 'yellow';
        else if (hasRed && hasBlue) r.activeColor = 'magenta';
        else if (hasGreen && hasBlue) r.activeColor = 'cyan';
        else if (hasRed) r.activeColor = 'red';
        else if (hasGreen) r.activeColor = 'green';
        else if (hasBlue) r.activeColor = 'blue';
      }
    });

    // Check level clear
    const allCleared = state.receptors.every(r => r.activeColor === r.color);
    if (allCleared && !state.clearPending) {
      state.clearPending = true;
      playLevelUp();
      setTimeout(() => {
        onLevelClear();
      }, 1200);
    }
  };

  useEffect(() => {
    loadLevel(level);
  }, [level]);

  // Main Render tick loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let requestID;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      const state = stateRef.current;

      const cellW = W / state.cols;
      const cellH = H / state.rows;

      ctx.fillStyle = '#02020a';
      ctx.fillRect(0, 0, W, H);

      // Optic table grid styling
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.03)';
      ctx.lineWidth = 1.0;
      for (let c = 0; c <= state.cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, H); ctx.stroke();
      }
      for (let r = 0; r <= state.rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(W, r * cellH); ctx.stroke();
      }

      // Draw subtle intersection nodes
      ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
      for (let r = 1; r < state.rows; r++) {
        for (let c = 1; c < state.cols; c++) {
          ctx.beginPath();
          ctx.arc(c * cellW, r * cellH, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Floating photon particles
      ctx.fillStyle = 'rgba(0, 242, 254, 0.06)';
      const particleCycle = (Date.now() * 0.0005) % 1;
      for (let i = 0; i < 15; i++) {
        const px = (Math.sin(i * 123.4) * 0.5 + 0.5) * W;
        const py = (((i * 56.7) / 100 + particleCycle) * H) % H;
        ctx.beginPath();
        ctx.arc(px, py, 1.0 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw placed blocks
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          const item = state.grid[r][c];
          if (item) {
            const cX = c * cellW + cellW / 2;
            const cY = r * cellH + cellH / 2;
            
            ctx.save();
            ctx.translate(cX, cY);
            ctx.rotate((item.rotation * Math.PI) / 180);

            if (item.type === 'mirror') {
              // Beveled metallic block housing
              ctx.fillStyle = '#11101e';
              ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
              ctx.lineWidth = 1.5;
              ctx.fillRect(-cellW * 0.35, -cellH * 0.35, cellW * 0.7, cellH * 0.7);
              ctx.strokeRect(-cellW * 0.35, -cellH * 0.35, cellW * 0.7, cellH * 0.7);

              // Glass reflective mirror layer diagonal
              ctx.save();
              ctx.shadowColor = '#00f2fe';
              ctx.shadowBlur = 8;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 4.0;
              ctx.beginPath();
              ctx.moveTo(-cellW * 0.28, cellH * 0.28);
              ctx.lineTo(cellW * 0.28, -cellH * 0.28);
              ctx.stroke();

              // Mirror border clips
              ctx.fillStyle = '#00f2fe';
              const clips = [[-cellW * 0.28, cellH * 0.28], [cellW * 0.28, -cellH * 0.28]];
              clips.forEach(([cx, cy]) => {
                ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
              });
              ctx.restore();
            } 
            else if (item.type === 'prism') {
              // Outer beveled base
              ctx.fillStyle = '#101625';
              ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(0, 0, Math.min(cellW, cellH) * 0.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Glass refracting triangle
              ctx.save();
              ctx.shadowColor = '#00f2fe';
              ctx.shadowBlur = 10;
              ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
              ctx.strokeStyle = '#00f2fe';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(0, -cellH * 0.32);
              ctx.lineTo(cellW * 0.32, cellH * 0.26);
              ctx.lineTo(-cellW * 0.32, cellH * 0.26);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            } 
            else if (item.type.startsWith('filter-')) {
              const colKey = item.type.split('-')[1];
              // Block base housing
              ctx.fillStyle = '#101018';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 1;
              ctx.fillRect(-cellW * 0.35, -cellH * 0.35, cellW * 0.7, cellH * 0.7);
              ctx.strokeRect(-cellW * 0.35, -cellH * 0.35, cellW * 0.7, cellH * 0.7);

              // Tinted beveled filter glass
              ctx.save();
              ctx.shadowColor = COLORS[colKey];
              ctx.shadowBlur = 8;
              ctx.fillStyle = `rgba(${colKey === 'red' ? '255,0,85' : colKey === 'green' ? '0,255,135' : '0,127,255'}, 0.28)`;
              ctx.strokeStyle = COLORS[colKey];
              ctx.lineWidth = 2.5;
              ctx.fillRect(-cellW * 0.08, -cellH * 0.3, cellW * 0.16, cellH * 0.6);
              ctx.strokeRect(-cellW * 0.08, -cellH * 0.3, cellW * 0.16, cellH * 0.6);
              ctx.restore();
            }

            ctx.restore();
          }
        }
      }

      // 3. Draw Laser emitters (Cyber cannons)
      state.emitters.forEach(em => {
        const cX = em.col * cellW + cellW / 2;
        const cY = em.row * cellH + cellH / 2;

        ctx.save();
        // Emitter casing
        ctx.fillStyle = '#14141d';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(cX, cY, Math.min(cellW, cellH) * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Laser color ring
        ctx.strokeStyle = COLORS[em.color];
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.arc(cX, cY, Math.min(cellW, cellH) * 0.26, 0, Math.PI * 2);
        ctx.stroke();

        // Core bright lens
        ctx.save();
        ctx.shadowColor = COLORS[em.color];
        ctx.shadowBlur = 12;
        ctx.fillStyle = COLORS[em.color];
        ctx.beginPath();
        ctx.arc(cX, cY, Math.min(cellW, cellH) * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Specular highlight white dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cX - 2, cY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // 4. Draw Receptors / Targets (Optic sensors)
      state.receptors.forEach(r => {
        const cX = r.col * cellW + cellW / 2;
        const cY = r.row * cellH + cellH / 2;

        ctx.save();
        // Casing base
        ctx.fillStyle = '#0a0a0f';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        
        // Draw octagon target shape
        const rad = Math.min(cellW, cellH) * 0.38;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          ctx.lineTo(cX + Math.cos(angle) * rad, cY + Math.sin(angle) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Target target ring
        ctx.strokeStyle = COLORS[r.color];
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          ctx.lineTo(cX + Math.cos(angle) * (rad * 0.85), cY + Math.sin(angle) * (rad * 0.85));
        }
        ctx.closePath();
        ctx.stroke();

        // Target lock-on plasma core
        if (r.activeColor === r.color) {
          ctx.save();
          ctx.shadowColor = COLORS[r.color];
          ctx.shadowBlur = 15;
          ctx.fillStyle = COLORS[r.color];
          ctx.beginPath();
          ctx.arc(cX, cY, rad * 0.45, 0, Math.PI * 2);
          ctx.fill();
          
          // Rotating locking brackets
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cX, cY, rad * 0.65, Date.now() * 0.008, Date.now() * 0.008 + Math.PI * 0.4);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cX, cY, rad * 0.65, Date.now() * 0.008 + Math.PI, Date.now() * 0.008 + Math.PI * 1.4);
          ctx.stroke();
          ctx.restore();
        } else {
          // Inactive light receiver lens
          ctx.fillStyle = '#1c1b26';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(cX, cY, rad * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

      // 5. Draw dynamic laser beams (Double-layered flickering beams!)
      state.beams.forEach(beam => {
        if (beam.points.length < 2) return;

        ctx.save();
        const beamColor = COLORS[beam.color] || beam.color;
        
        // Outer glowing outline
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 4.5 + Math.sin(Date.now() * 0.04) * 0.5; // high-frequency energy flickering!
        ctx.shadowColor = beamColor;
        ctx.shadowBlur = 12;
        
        ctx.beginPath();
        let startX = beam.points[0].col * cellW + cellW / 2;
        let startY = beam.points[0].row * cellH + cellH / 2;
        ctx.moveTo(startX, startY);

        for (let i = 1; i < beam.points.length; i++) {
          const pt = beam.points[i];
          const x = pt.col * cellW + cellW / 2;
          const y = pt.row * cellH + cellH / 2;
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Inner white high-density laser core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        for (let i = 1; i < beam.points.length; i++) {
          const pt = beam.points[i];
          const x = pt.col * cellW + cellW / 2;
          const y = pt.row * cellH + cellH / 2;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      requestID = requestAnimationFrame(render);
    };

    calculateLasers();
    requestID = requestAnimationFrame(render);

    return () => cancelAnimationFrame(requestID);
  }, [level]);

  // Touch/Grid placement handler
  const handleGridClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const state = stateRef.current;
    const col = Math.floor(clickX / (canvas.width / state.cols));
    const row = Math.floor(clickY / (canvas.height / state.rows));

    // Bounds checking
    if (col < 0 || col >= state.cols || row < 0 || row >= state.rows) return;

    // Check if cell is an emitter or receptor (blocked)
    const isEmitter = state.emitters.some(em => em.col === col && em.row === row);
    const isReceptor = state.receptors.some(r => r.col === col && r.row === row);
    if (isEmitter || isReceptor) return;

    const currentCell = state.grid[row][col];

    if (currentCell) {
      // Rotation click
      currentCell.rotation = (currentCell.rotation + 90) % 360;
      playRotate();
      calculateLasers();
    } else if (selectedBlock && inventory[selectedBlock] > 0) {
      // Placement operation
      state.grid[row][col] = {
        type: selectedBlock,
        rotation: 0
      };
      // Decrement inventory
      setInventory(prev => ({
        ...prev,
        [selectedBlock]: prev[selectedBlock] - 1
      }));
      setSelectedBlock(null);
      playPlace();
      calculateLasers();
    }
  };

  // Double click retrieval
  const handleGridDoubleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const state = stateRef.current;
    const col = Math.floor(clickX / (canvas.width / state.cols));
    const row = Math.floor(clickY / (canvas.height / state.rows));

    const currentCell = state.grid[row][col];
    if (currentCell) {
      // Return block to inventory
      setInventory(prev => ({
        ...prev,
        [currentCell.type]: prev[currentCell.type] + 1
      }));
      state.grid[row][col] = null;
      playPlace(); // retrieval click
      calculateLasers();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = Math.max(480, window.innerHeight - 150);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* HUD Header info */}
      <div style={{ height: '50px', background: 'rgba(5, 5, 15, 0.9)', borderBottom: '1px solid rgba(255,0,127,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontFamily: 'Orbitron' }}>
        <div style={{ fontSize: '12px' }}>
          SECTOR: <span style={{ color: '#ff007f' }}>{level}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-cyber secondary" style={{ padding: '4px 12px', fontSize: '10px' }} onClick={() => loadLevel(level)}>RESET WAVE</button>
          <button className="btn-cyber secondary" style={{ padding: '4px 12px', fontSize: '10px', borderColor: '#ff0055', color: '#ff0055' }} onClick={onQuit}>ABORT</button>
        </div>
      </div>

      {/* Primary Canvas grid */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onClick={handleGridClick}
          onDoubleClick={handleGridDoubleClick}
          style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Draggable/Selectable Inventory blocks */}
      <div className="inventory-container">
        {Object.entries(inventory).map(([type, count]) => {
          if (count === 0 && selectedBlock !== type) return null;
          return (
            <button
              key={type}
              className={`inventory-item ${selectedBlock === type ? 'active' : ''}`}
              onClick={() => setSelectedBlock(selectedBlock === type ? null : type)}
            >
              <span style={{ fontSize: '15px' }}>
                {type === 'mirror' && '╱'}
                {type === 'prism' && '▲'}
                {type === 'filter-red' && '🟥'}
                {type === 'filter-green' && '🟩'}
                {type === 'filter-blue' && '🟦'}
              </span>
              <span style={{ fontSize: '8px', textTransform: 'uppercase', marginTop: '2px' }}>{type.replace('filter-', '')}</span>
              <div className="count-badge">{count}</div>
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default GameCanvas;
