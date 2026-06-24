import { DEFAULT_MODEL } from './Modelodeejemplo.js';
import { Model3D } from './Model3D.js';
import { RenderMode, SoftwareRenderer } from './Renderer.js';

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`No se encontró el elemento #${id}`);
  return element as T;
}

const canvas = getElement<HTMLCanvasElement>('viewer-canvas');
const canvasContainer = getElement<HTMLDivElement>('canvas-container');
const drawingContext = canvas.getContext('2d', { alpha: true });

if (drawingContext === null) {
  throw new Error('El navegador no pudo crear el contexto 2D.');
}

const context: CanvasRenderingContext2D = drawingContext;

const model = new Model3D();
const renderer = new SoftwareRenderer();

const fileInput = getElement<HTMLInputElement>('file-input');
const openFileButton = getElement<HTMLButtonElement>('open-file');
const demoButton = getElement<HTMLButtonElement>('load-demo');
const playPauseButton = getElement<HTMLButtonElement>('play-pause');
const speedInput = getElement<HTMLInputElement>('animation-speed');
const speedValue = getElement<HTMLSpanElement>('speed-value');
const renderModeSelect = getElement<HTMLSelectElement>('render-mode');
const statusText = getElement<HTMLSpanElement>('status-text');
const modelInfo = getElement<HTMLSpanElement>('model-info');
const pieceSelect = getElement<HTMLSelectElement>('piece-select');
const pieceRotationAxis = getElement<HTMLSelectElement>('piece-rotation-axis');
const modelRotationAxis = getElement<HTMLSelectElement>('model-rotation-axis');
const separationInput = getElement<HTMLInputElement>('separation');
const separationValue = getElement<HTMLSpanElement>('separation-value');
const emptyState = getElement<HTMLDivElement>('empty-state');

let renderMode: RenderMode = 'hidden';
let selectedPiece = 0;
let playing = false;
let animationSpeed = Number(speedInput.value);
let renderRequested = true;
let lastAnimationTime = performance.now();
let lastRenderTime = 0;

function requestRender(): void {
  renderRequested = true;
}

function setStatus(message: string, error = false): void {
  statusText.textContent = message;
  statusText.classList.toggle('status-error', error);
}

function refreshModelInformation(): void {
  const pieces = model.getPieces();
  modelInfo.textContent =
    `${model.getVertexCount()} vértices · ${model.getFaceCount()} caras · ` +
    `${pieces.length} ${pieces.length === 1 ? 'pieza' : 'piezas'}`;

  pieceSelect.replaceChildren();
  pieces.forEach((piece, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = piece.name;
    pieceSelect.append(option);
  });

  selectedPiece = Math.min(selectedPiece, Math.max(0, pieces.length - 1));
  pieceSelect.value = String(selectedPiece);
  separationInput.value = '0';
  separationValue.textContent = '0%';
  emptyState.hidden = true;
}

function loadModel(text: string, name: string): void {
  try {
    playing = false;
    updatePlayButton();
    model.loadFromText(text, name);
    refreshModelInformation();
    setStatus(`Modelo cargado: ${name}`);
    requestRender();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible leer el archivo.';
    setStatus(message, true);
  }
}

async function loadFile(file: File): Promise<void> {
  if (file.size > 8 * 1024 * 1024) {
    setStatus('El archivo supera el límite recomendado de 8 MB.', true);
    return;
  }

  try {
    const text = await file.text();
    loadModel(text, file.name);
  } catch {
    setStatus('No fue posible leer el archivo seleccionado.', true);
  }
}

function updatePlayButton(): void {
  playPauseButton.dataset.playing = String(playing);
  playPauseButton.setAttribute('aria-pressed', String(playing));
  playPauseButton.innerHTML = playing
    ? '<span aria-hidden="true">Ⅱ</span><span>Pausar</span>'
    : '<span aria-hidden="true">▶</span><span>Reproducir</span>';
}

function togglePlayback(): void {
  playing = !playing;
  lastAnimationTime = performance.now();
  updatePlayButton();
  setStatus(playing ? 'Animación en reproducción.' : 'Animación en pausa.');
}

function resizeCanvas(): void {
  const bounds = canvasContainer.getBoundingClientRect();
  const width = Math.max(320, Math.floor(bounds.width));
  const height = Math.max(360, Math.floor(bounds.height));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    requestRender();
  }
}

function renderFrame(now: number): void {
  const elapsed = Math.min(0.05, Math.max(0, (now - lastAnimationTime) / 1000));
  lastAnimationTime = now;

  if (playing) {
    model.rotateModel('y', elapsed * animationSpeed);
    requestRender();
  }

  const minimumInterval = renderMode === 'zbuffer' ? 32 : 16;
  if (renderRequested && now - lastRenderTime >= minimumInterval) {
    renderer.render(context, canvas, model, renderMode);
    renderRequested = false;
    lastRenderTime = now;
  }

  requestAnimationFrame(renderFrame);
}

function modelStep(): number {
  return model.getRadius() * 0.09;
}

function pieceStep(): number {
  return model.getRadius() * 0.075;
}

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function bindClick(id: string, action: () => void): void {
  getElement<HTMLButtonElement>(id).addEventListener('click', () => {
    action();
    requestRender();
  });
}

openFileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void loadFile(file);
  fileInput.value = '';
});

demoButton.addEventListener('click', () => loadModel(DEFAULT_MODEL, 'Modelo de demostración'));

playPauseButton.addEventListener('click', togglePlayback);
speedInput.addEventListener('input', () => {
  animationSpeed = Number(speedInput.value);
  speedValue.textContent = `${animationSpeed.toFixed(1)}×`;
});

renderModeSelect.addEventListener('change', () => {
  renderMode = renderModeSelect.value as RenderMode;
  setStatus(
    renderMode === 'wireframe'
      ? 'Modo alámbrico.'
      : renderMode === 'hidden'
        ? 'Modo de líneas ocultas.'
        : 'Modo Z-buffer.'
  );
  requestRender();
});

pieceSelect.addEventListener('change', () => {
  selectedPiece = Number(pieceSelect.value);
});

separationInput.addEventListener('input', () => {
  const percentage = Number(separationInput.value);
  model.setSeparation(model.getRadius() * 1.35 * percentage / 100);
  separationValue.textContent = `${percentage}%`;
  requestRender();
});

bindClick('view-left', () => model.orbitCamera(-0.12, 0));
bindClick('view-right', () => model.orbitCamera(0.12, 0));
bindClick('view-up', () => model.orbitCamera(0, -0.1));
bindClick('view-down', () => model.orbitCamera(0, 0.1));
bindClick('zoom-in', () => model.zoomCamera(0.82));
bindClick('zoom-out', () => model.zoomCamera(1.22));
bindClick('reset-view', () => model.resetView());

bindClick('model-x-minus', () => model.translateModel(-modelStep(), 0, 0));
bindClick('model-x-plus', () => model.translateModel(modelStep(), 0, 0));
bindClick('model-y-minus', () => model.translateModel(0, -modelStep(), 0));
bindClick('model-y-plus', () => model.translateModel(0, modelStep(), 0));
bindClick('model-z-minus', () => model.translateModel(0, 0, -modelStep()));
bindClick('model-z-plus', () => model.translateModel(0, 0, modelStep()));
bindClick('model-rotate-minus', () => {
  model.rotateModel(modelRotationAxis.value as 'x' | 'y' | 'z', degreesToRadians(-10));
});
bindClick('model-rotate-plus', () => {
  model.rotateModel(modelRotationAxis.value as 'x' | 'y' | 'z', degreesToRadians(10));
});
bindClick('reset-model', () => model.resetModelTransform());

bindClick('piece-x-minus', () => model.translatePiece(selectedPiece, -pieceStep(), 0, 0));
bindClick('piece-x-plus', () => model.translatePiece(selectedPiece, pieceStep(), 0, 0));
bindClick('piece-y-minus', () => model.translatePiece(selectedPiece, 0, -pieceStep(), 0));
bindClick('piece-y-plus', () => model.translatePiece(selectedPiece, 0, pieceStep(), 0));
bindClick('piece-z-minus', () => model.translatePiece(selectedPiece, 0, 0, -pieceStep()));
bindClick('piece-z-plus', () => model.translatePiece(selectedPiece, 0, 0, pieceStep()));
bindClick('piece-rotate-minus', () => {
  model.rotatePiece(
    selectedPiece,
    pieceRotationAxis.value as 'x' | 'y' | 'z',
    degreesToRadians(-10)
  );
});
bindClick('piece-rotate-plus', () => {
  model.rotatePiece(
    selectedPiece,
    pieceRotationAxis.value as 'x' | 'y' | 'z',
    degreesToRadians(10)
  );
});
bindClick('reset-piece', () => model.resetPiece(selectedPiece));
bindClick('join-pieces', () => {
  separationInput.value = '0';
  separationValue.textContent = '0%';
  model.setSeparation(0);
});
bindClick('reset-all', () => {
  model.resetAllTransforms();
  model.resetView();
  separationInput.value = '0';
  separationValue.textContent = '0%';
  setStatus('Vista y transformaciones restablecidas.');
});

canvasContainer.addEventListener('dragover', (event) => {
  event.preventDefault();
  canvasContainer.classList.add('drag-active');
});
canvasContainer.addEventListener('dragleave', () => {
  canvasContainer.classList.remove('drag-active');
});
canvasContainer.addEventListener('drop', (event) => {
  event.preventDefault();
  canvasContainer.classList.remove('drag-active');
  const file = event.dataTransfer?.files[0];
  if (file) void loadFile(file);
});

let dragging = false;
let dragPiece = false;
let previousX = 0;
let previousY = 0;

canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragPiece = event.shiftKey;
  previousX = event.clientX;
  previousY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add('is-dragging');
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;

  const deltaX = event.clientX - previousX;
  const deltaY = event.clientY - previousY;
  previousX = event.clientX;
  previousY = event.clientY;

  if (dragPiece) {
    const scale = model.getRadius() / 260;
    model.translatePiece(selectedPiece, deltaX * scale, -deltaY * scale, 0);
  } else {
    model.orbitCamera(-deltaX * 0.008, deltaY * 0.008);
  }
  requestRender();
});

function stopDragging(event: PointerEvent): void {
  dragging = false;
  canvas.classList.remove('is-dragging');
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
canvas.addEventListener('contextmenu', (event) => event.preventDefault());

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  model.zoomCamera(Math.exp(event.deltaY * 0.0012));
  requestRender();
}, { passive: false });

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  switch (event.key) {
    case ' ':
      event.preventDefault();
      togglePlayback();
      break;
    case 'ArrowLeft':
      model.orbitCamera(-0.1, 0);
      requestRender();
      break;
    case 'ArrowRight':
      model.orbitCamera(0.1, 0);
      requestRender();
      break;
    case 'ArrowUp':
      model.orbitCamera(0, -0.08);
      requestRender();
      break;
    case 'ArrowDown':
      model.orbitCamera(0, 0.08);
      requestRender();
      break;
    case '+':
    case '=':
      model.zoomCamera(0.85);
      requestRender();
      break;
    case '-':
      model.zoomCamera(1.18);
      requestRender();
      break;
    case 'r':
    case 'R':
      model.resetView();
      requestRender();
      break;
  }
});

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(canvasContainer);

loadModel(DEFAULT_MODEL, 'Modelo de demostración');
resizeCanvas();
updatePlayButton();
requestAnimationFrame(renderFrame);
