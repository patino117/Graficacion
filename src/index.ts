import { CanvasLocal } from './canvasLocal.js';

let canvas: HTMLCanvasElement;
let graphics: CanvasRenderingContext2D;

canvas = <HTMLCanvasElement>document.getElementById('circlechart');

graphics = canvas.getContext('2d');

const miCanvas: CanvasLocal = new CanvasLocal(graphics, canvas);

const x1Input = <HTMLInputElement>document.getElementById('x1-input');
const y1Input = <HTMLInputElement>document.getElementById('y1-input');
const x2Input = <HTMLInputElement>document.getElementById('x2-input');
const y2Input = <HTMLInputElement>document.getElementById('y2-input');
const botonGraficar = <HTMLButtonElement>document.getElementById('btn-draw');
const btnLimpiar = <HTMLButtonElement>document.getElementById('btn-clear');

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

