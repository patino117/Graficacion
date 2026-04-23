import { CanvasLocal } from './canvasLocal.js';
let canvas;
let graphics;
canvas = document.getElementById('circlechart');
graphics = canvas.getContext('2d');
const miCanvas = new CanvasLocal(graphics, canvas);
const x1Input = document.getElementById('x1-input');
const y1Input = document.getElementById('y1-input');
const x2Input = document.getElementById('x2-input');
const y2Input = document.getElementById('y2-input');
const botonGraficar = document.getElementById('btn-draw');
const btnLimpiar = document.getElementById('btn-clear');
botonGraficar.addEventListener('click', () => {
    if (x1Input && y1Input && x2Input && y2Input) {
        const x1 = parseFloat(x1Input.value);
        const y1 = parseFloat(y1Input.value);
        const x2 = parseFloat(x2Input.value);
        const y2 = parseFloat(y2Input.value);
        miCanvas.agregarLinea(x1, y1, x2, y2);
    }
});
btnLimpiar.addEventListener('click', () => {
    miCanvas.limpiarPantalla();
});
