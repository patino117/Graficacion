export class CanvasBarras {
    private ctx: CanvasRenderingContext2D;
    private canvasWidth: number;
    private canvasHeight: number;

    public constructor(g: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        this.ctx = g;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
    }

    public limpiar(): void {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    public graficarDatos(datos: number[]): void {
        this.limpiar();
        if (datos.length === 0) return;

        const maxValor = Math.max(...datos);
        const margenIzquierdo = 60;
        const margenSuperior = 50;
        const espacioEntreBarras = 20;
        
        const anchoMaximoDisponible = this.canvasWidth - margenIzquierdo - 120; 
        
        const altoBarra = Math.min(35, (this.canvasHeight - 100) / datos.length - espacioEntreBarras);

        const colores = [
            { f: '#e74c3c', s: '#ff7979', l: '#c0392b' }, // Rojo
            { f: '#f1c40f', s: '#f9e79f', l: '#f39c12' }, // Amarillo
            { f: '#2ecc71', s: '#82e0aa', l: '#27ae60' }, // Verde
            { f: '#3498db', s: '#85c1e9', l: '#2980b9' }, // Azul
            { f: '#9b59b6', s: '#d7bde2', l: '#8e44ad' }  // Morado
        ];

        for (let i = 0; i < datos.length; i++) {
            const valor = datos[i];
            
            const anchoBarra = (valor * anchoMaximoDisponible) / maxValor;
            const posicionY = margenSuperior + i * (altoBarra + espacioEntreBarras);
            
            const colorSet = colores[i % colores.length];

            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(valor.toString(), margenIzquierdo - 35, posicionY + altoBarra / 2 + 5);

            this.dibujarBarra3D(
                margenIzquierdo, 
                posicionY, 
                anchoBarra, 
                altoBarra, 
                colorSet.f, colorSet.s, colorSet.l
            );
        }
    }

    private dibujarBarra3D(x: number, y: number, ancho: number, alto: number, colorFrente: string, colorSuperior: string, colorLateral: string): void {
        const prof = 15;

        this.ctx.fillStyle = colorSuperior;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + prof, y - prof);
        this.ctx.lineTo(x + ancho + prof, y - prof); 
        this.ctx.lineTo(x + ancho, y);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = colorLateral;
        this.ctx.beginPath();
        this.ctx.moveTo(x + ancho, y); 
        this.ctx.lineTo(x + ancho + prof, y - prof); 
        this.ctx.lineTo(x + ancho + prof, y + alto - prof); 
        this.ctx.lineTo(x + ancho, y + alto); 
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = colorFrente;
        this.ctx.fillRect(x, y, ancho, alto);
    }
}