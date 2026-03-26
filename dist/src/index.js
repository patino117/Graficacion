/*Suele ser el punto de entrada. Aquí es donde se suele inicializar el lienzo y se llaman a las funciones de dibujo. */
import { CanvasLocal } from './canvasLocal.js';
let canvas;
let graphics;
canvas = document.getElementById('circlechart');
graphics = canvas.getContext('2d');
const miCanvas = new CanvasLocal(graphics, canvas);
miCanvas.paint();
