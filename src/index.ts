/*Suele ser el punto de entrada. Aquí es donde se suele inicializar el lienzo y se llaman a las funciones de dibujo. */
import { CanvasLocal } from './canvasLocal.js';

let canvas: HTMLCanvasElement;
let graphics: CanvasRenderingContext2D;

canvas = <HTMLCanvasElement>document.getElementById('circlechart');
graphics = canvas.getContext('2d');

const miCanvas:CanvasLocal = new CanvasLocal(graphics, canvas);

miCanvas.paint();