export class CanvasLocal {
  protected graphics: CanvasRenderingContext2D;
  protected rWidth: number;
  protected rHeight: number;
  protected maxX: number;
  protected maxY: number;
  protected pixelSize: number;
  protected centerX: number;
  protected centerY: number;
  private memoriaLineas: { x1: number, y1: number, x2: number, y2: number }[] = [];

  public constructor(g: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.graphics = g;
    this.rWidth = 6;
    this.rHeight = 4;
    this.maxX = canvas.width - 1
    this.maxY = canvas.height - 1;
    this.pixelSize = Math.max(this.rWidth / this.maxX, this.rHeight / this.maxY);
    this.centerX = this.maxX / 2;
    this.centerY = this.maxY / 2;
  }

  //Memoria
  public agregarLinea(x1: number, y1: number, x2: number, y2: number): void {
    this.memoriaLineas.push({ x1, y1, x2, y2 });
    this.redibujarTodo();
  }

  public limpiarPantalla(): void {
    this.memoriaLineas = [];
    this.redibujarTodo();
  }

  private redibujarTodo(): void {
    this.graphics.clearRect(0, 0, 640, 480);
    this.dibujarCuadricula();

    this.memoriaLineas.forEach(linea => {
      this.drawLine(linea.x1, linea.y1, linea.x2, linea.y2);
    });
  }

  public limpiarYLineas(x1: number, y1: number, x2: number, y2: number): void {
    //Ccanvas (640x480)
    this.graphics.clearRect(0, 0, 640, 480);

    this.dibujarCuadricula();

    this.drawLine(x1, y1, x2, y2);
  }

  //Fondo
  private dibujarCuadricula(): void {
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

  public drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.graphics.beginPath();
    this.graphics.moveTo(x1, y1);
    this.graphics.lineTo(x2, y2);
    this.graphics.closePath();
    this.graphics.stroke();
  }

  public paint(): void {
  }


}