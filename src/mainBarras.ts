import { CanvasBarras } from './CanvasBarras.js';

const canvas = <HTMLCanvasElement>document.getElementById('canvas-barras');
const ctx = canvas.getContext('2d');
const inputDatos = <HTMLInputElement>document.getElementById('datos-input');
const btnGraficar = <HTMLButtonElement>document.getElementById('btn-graficar-barras');

if (ctx && canvas) {
    const miGrafico = new CanvasBarras(ctx, canvas);

    btnGraficar.addEventListener('click', () => {
        const textoCrudo = inputDatos.value;

        const arregloNumeros = textoCrudo
            .split(',')
            .map(texto => parseFloat(texto.trim()))
            .filter(numero => !isNaN(numero));

        if (arregloNumeros.length > 0) {
            console.log("Graficando estos datos:", arregloNumeros);
            miGrafico.graficarDatos(arregloNumeros);
        } else {
            alert("Ingresa números válidos separados por coma (ejemplo: 10, 20, 30).");
        }
    });
} else {
    console.error("No se que pasa pero pasa algo :)");
}