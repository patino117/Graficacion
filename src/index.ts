/*Suele ser el punto de entrada. Aquí es donde se suele inicializar el lienzo y se llaman a las funciones de dibujo. */
import { CanvasLocal } from './canvasLocal.js';

let canvas: HTMLCanvasElement;
let graphics: CanvasRenderingContext2D;

canvas = <HTMLCanvasElement>document.getElementById('circlechart');

graphics = canvas.getContext('2d');

const miCanvas: CanvasLocal = new CanvasLocal(graphics, canvas);

// 1. Localizamos los elementos una sola vez al cargar la página
// En index.ts
const x1Input = <HTMLInputElement>document.getElementById('x1-input');
const y1Input = <HTMLInputElement>document.getElementById('y1-input');
const x2Input = <HTMLInputElement>document.getElementById('x2-input');
const y2Input = <HTMLInputElement>document.getElementById('y2-input');
const botonGraficar = <HTMLButtonElement>document.getElementById('btn-draw');
const btnLimpiar = <HTMLButtonElement>document.getElementById('btn-clear');

botonGraficar.addEventListener('click', () => {
    // Verificamos que los elementos existan antes de leer su valor
    if (x1Input && y1Input && x2Input && y2Input) {
        const x1 = parseFloat(x1Input.value);
        const y1 = parseFloat(y1Input.value);
        const x2 = parseFloat(x2Input.value);
        const y2 = parseFloat(y2Input.value);

        // ESTA ES LA LÍNEA CLAVE: Debe decir 'agregarLinea'
        miCanvas.agregarLinea(x1, y1, x2, y2);
    }
});

// El botón de limpiar vacía la memoria del objeto
btnLimpiar.addEventListener('click', () => {
    miCanvas.limpiarPantalla();
});

