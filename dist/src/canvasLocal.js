/*Probablemente contiene la lógica específica o las clases para dibujar figuras en el canvas.*/
export class CanvasLocal {
    graphics;
    rWidth;
    rHeight;
    maxX;
    maxY;
    pixelSize;
    centerX;
    centerY;
    memoriaLineas = [];
    constructor(g, canvas) {
        this.graphics = g;
        this.rWidth = 6;
        this.rHeight = 4;
        this.maxX = canvas.width - 1;
        this.maxY = canvas.height - 1;
        this.pixelSize = Math.max(this.rWidth / this.maxX, this.rHeight / this.maxY);
        this.centerX = this.maxX / 2;
        this.centerY = this.maxY / 2;
    }
    // 1. Agregamos la línea a la memoria y redibujamos
    agregarLinea(x1, y1, x2, y2) {
        this.memoriaLineas.push({ x1, y1, x2, y2 });
        this.redibujarTodo();
    }
    // 2. Vaciamos la memoria y redibujamos (solo quedará la cuadrícula)
    limpiarPantalla() {
        this.memoriaLineas = [];
        this.redibujarTodo();
    }
    // 3. El "Director de Orquesta": Limpia, pone cuadrícula y dibuja cada línea guardada
    redibujarTodo() {
        this.graphics.clearRect(0, 0, 640, 480);
        this.dibujarCuadricula();
        // Recorremos la memoria para pintar cada línea
        this.memoriaLineas.forEach(linea => {
            this.drawLine(linea.x1, linea.y1, linea.x2, linea.y2);
        });
    }
    limpiarYLineas(x1, y1, x2, y2) {
        // 1. Limpiamos todo el canvas (640x480)
        this.graphics.clearRect(0, 0, 640, 480);
        // 2. Dibujamos el fondo de libreta
        this.dibujarCuadricula();
        // 3. Dibujamos la línea con los datos recibidos (encima de la cuadrícula)
        this.drawLine(x1, y1, x2, y2);
    }
    // Método para dibujar el fondo de libreta
    dibujarCuadricula() {
        const tamanoCuadro = 40; // Esto simula nuestro "1 cm" o cuadro
        const anchoCanvas = 640;
        const altoCanvas = 480;
        this.graphics.save(); // Guardamos la configuración actual del pincel
        this.graphics.lineWidth = 0.5; // Líneas muy delgaditas
        this.graphics.strokeStyle = '#e0e0e0'; // Color gris claro (cuaderno)
        this.graphics.beginPath();
        // 1. Dibujamos las líneas verticales
        for (let x = 0; x <= anchoCanvas; x += tamanoCuadro) {
            this.graphics.moveTo(x, 0);
            this.graphics.lineTo(x, altoCanvas);
        }
        // 2. Dibujamos las líneas horizontales
        for (let y = 0; y <= altoCanvas; y += tamanoCuadro) {
            this.graphics.moveTo(0, y);
            this.graphics.lineTo(anchoCanvas, y);
        }
        this.graphics.stroke(); // Pintamos todas las líneas
        this.graphics.restore(); // Regresamos el pincel a su estado normal (para que tu línea principal no salga gris)
    }
    drawLine(x1, y1, x2, y2) {
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.closePath();
        this.graphics.stroke();
    }
    paint() {
        // Espacio reservado para dibujos por defecto si los necesitas después
    }
}
