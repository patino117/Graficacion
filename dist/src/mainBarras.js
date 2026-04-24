import { CanvasBarras } from './CanvasBarras.js';
// 1. Obtener los elementos del DOM (Asegúrate de que los IDs coincidan con tu GBarras.html)
const canvas = document.getElementById('canvas-barras');
const ctx = canvas.getContext('2d');
const inputDatos = document.getElementById('datos-input');
const btnGraficar = document.getElementById('btn-graficar-barras');
// Verificamos que el canvas exista para evitar errores de null
if (ctx && canvas) {
    // 2. Instanciamos nuestra nueva clase 3D
    const miGrafico = new CanvasBarras(ctx, canvas);
    // 3. Escuchar el clic del botón
    btnGraficar.addEventListener('click', () => {
        // Leemos el texto crudo que escribió el usuario
        const textoCrudo = inputDatos.value;
        // --- LA MAGIA DE LA CONVERSIÓN ---
        // 1. split(','): Corta el texto en pedazos cada vez que ve una coma -> ["10", " 20", "30"]
        // 2. map(...): Limpia los espacios y convierte cada pedazo de texto a número (parseFloat)
        // 3. filter(...): Elimina cualquier cosa que no sea un número (por si el usuario escribió letras)
        const arregloNumeros = textoCrudo
            .split(',')
            .map(texto => parseFloat(texto.trim()))
            .filter(numero => !isNaN(numero));
        // 4. Si logramos obtener números válidos, mandamos a graficar
        if (arregloNumeros.length > 0) {
            console.log("Graficando estos datos:", arregloNumeros);
            miGrafico.graficarDatos(arregloNumeros);
        }
        else {
            alert("⚠️ Por favor, ingresa números válidos separados por coma (ejemplo: 10, 20, 30).");
        }
    });
}
else {
    console.error("No se encontró el canvas en el HTML.");
}
