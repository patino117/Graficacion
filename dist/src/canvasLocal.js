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
    //Memoria
    agregarLinea(x1, y1, x2, y2) {
        this.memoriaLineas.push({ x1, y1, x2, y2 });
        this.redibujarTodo();
    }
    limpiarPantalla() {
        this.memoriaLineas = [];
        this.redibujarTodo();
    }
    redibujarTodo() {
        this.graphics.clearRect(0, 0, 640, 480);
        this.dibujarCuadricula();
        this.memoriaLineas.forEach(linea => {
            this.drawLine(linea.x1, linea.y1, linea.x2, linea.y2);
        });
    }
    limpiarYLineas(x1, y1, x2, y2) {
        //Ccanvas (640x480)
        this.graphics.clearRect(0, 0, 640, 480);
        this.dibujarCuadricula();
        this.drawLine(x1, y1, x2, y2);
    }
    //Fondo
    dibujarCuadricula() {
        const tamanoCuadro = 40;
        const anchoCanvas = 640;
        const altoCanvas = 480;
        this.graphics.save();
        this.graphics.lineWidth = 0.5;
        this.graphics.strokeStyle = '#e0e0e0';
        this.graphics.beginPath();
        for (let x = 0; x <= anchoCanvas; x += tamanoCuadro) {
            this.graphics.moveTo(x, 0);
            this.graphics.lineTo(x, altoCanvas);
        }
        for (let y = 0; y <= altoCanvas; y += tamanoCuadro) {
            this.graphics.moveTo(0, y);
            this.graphics.lineTo(anchoCanvas, y);
        }
        this.graphics.stroke();
        this.graphics.restore();
    }
    drawLine(x1, y1, x2, y2) {
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.closePath();
        this.graphics.stroke();
    }
    paint() {
    }
}
