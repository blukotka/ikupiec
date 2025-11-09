const TILE_COLS = 4;
const TILE_ROWS = 4;
const TILE_COUNT = TILE_COLS * TILE_ROWS;
const btnLocate = document.getElementById('btn-locate');
const btnGetMap = document.getElementById('btn-getmap');
const mapContainer = document.getElementById('map');
const stol = document.getElementById('stol');       
const ukladanka = document.getElementById('ukladanka'); 

let map;           
let lastRaster;    
let tiles = [];     

function initMap() {
  map = L.map('map').setView([51.1079, 17.0385], 13); 
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM'
  }).addTo(map);
}
btnLocate.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation API nie jest dostępne.');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    alert(`Twoja pozycja: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    map.setView([latitude, longitude], 16);
    L.marker([latitude, longitude]).addTo(map).bindPopup('Twoja lokalizacja').openPopup();
  }, err => {
    alert('Blokada lub błąd pobierania lokalizacji: ' + err.message);
  });
});
async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}
requestNotificationPermission();
btnGetMap.addEventListener('click', async () => {
  const canvas = await html2canvas(mapContainer, { useCORS: true, logging: false });
  lastRaster = canvas;
  document.body.appendChild(canvas);
  canvas.style.border = "2px solid red";
  canvas.style.display = "block";
  canvas.style.margin = "10px auto";
  splitCanvasToTiles(canvas);
  renderTilesOnStol();
  prepareUkladankaPlaceholders();
});

function splitCanvasToTiles(canvas) {
  tiles = [];
  const tileW = Math.floor(canvas.width / TILE_COLS);
  const tileH = Math.floor(canvas.height / TILE_ROWS);

  const ctx = canvas.getContext('2d');

  let index = 0;
  for (let r = 0; r < TILE_ROWS; r++) {
    for (let c = 0; c < TILE_COLS; c++) {
      const imageData = ctx.getImageData(c * tileW, r * tileH, tileW, tileH);
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileW;
      tileCanvas.height = tileH;
      tileCanvas.getContext('2d').putImageData(imageData, 0, 0);

      const dataURL = tileCanvas.toDataURL();

      tiles.push({
        imgSrc: dataURL,
        correctIndex: index, 
        currentIndex: null
      });
      index++;
    }
  }

  shuffleArray(tiles);
  tiles.forEach((t, i) => t.currentIndex = i);
}
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
function renderTilesOnStol() {
  stol.innerHTML = '';
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    const img = document.createElement('img');
    img.className = 'tile';
    img.draggable = true;
    img.dataset.tileIndex = i;
    img.src = t.imgSrc;
    img.addEventListener('dragstart', onDragStart);
    stol.appendChild(img);
  }
}

function prepareUkladankaPlaceholders() {
  ukladanka.innerHTML = '';
  for (let i = 0; i < TILE_COUNT; i++) {
    const ph = document.createElement('div');
    ph.className = 'placeholder';
    ph.dataset.targetIndex = i;
    ph.addEventListener('dragover', onDragOver);
    ph.addEventListener('drop', onDropOnPlaceholder);
    ukladanka.appendChild(ph);
  }
}
let draggedTileIndex = null;
function onDragStart(e) {
  draggedTileIndex = e.target.dataset.tileIndex;
  e.dataTransfer.setData('text/plain', draggedTileIndex);
}
function onDragOver(e) {
  e.preventDefault();
}
function onDropOnPlaceholder(e) {
  e.preventDefault();
  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
  const targetIndex = parseInt(e.currentTarget.dataset.targetIndex, 10);
  if (e.currentTarget.firstChild) {
    stol.appendChild(e.currentTarget.firstChild);
  }

  const img = document.querySelector(`img[data-tile-index="${fromIndex}"]`);
  if (img) {
    e.currentTarget.appendChild(img);
  }

  tiles[fromIndex].currentIndex = (e.currentTarget.contains(img) ? targetIndex : null);

  checkIfSolved();
}

function checkIfSolved() {
  const placeholders = Array.from(ukladanka.children);
  for (let i = 0; i < placeholders.length; i++) {
    const ph = placeholders[i];
    if (!ph.firstChild) return false; 
    const img = ph.firstChild;
    const tileIdx = parseInt(img.dataset.tileIndex, 10);
    if (tiles[tileIdx].correctIndex !== i) return false;
  }
  showVictoryNotification();
  return true;
}

function showVictoryNotification() {
  if (Notification && Notification.permission === 'granted') {
    new Notification('Gratulacje!', { body: 'Ułożyłeś wszystkie puzzle!' });
  } else {
    alert('Gratulacje! Ułożyłeś wszystkie puzzle!');
  }
}

initMap();
