export class CanvasBarras {
    ctx;
    canvasWidth;
    canvasHeight;
    constructor(g, canvas) {
        this.ctx = g;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
    }
    limpiar() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    // Método principal que calculará la escala y dibujará todo el gráfico
    graficarDatos(datos) {
        this.limpiar();
        if (datos.length === 0)
            return;
        // 1. Matemáticas para escalar: Buscamos el número mayor para que no se salga del canvas
        const maxValor = Math.max(...datos);
        const margenIzquierdo = 60;
        const margenSuperior = 50;
        const espacioEntreBarras = 20;
        // Dejamos 120px libres a la derecha para que la perspectiva 3D no se corte
        const anchoMaximoDisponible = this.canvasWidth - margenIzquierdo - 120;
        // Calculamos el alto de cada barra para que todas quepan en la pantalla
        const altoBarra = Math.min(35, (this.canvasHeight - 100) / datos.length - espacioEntreBarras);
        // Paleta de colores: {f: Frente, s: Superior (claro), l: Lateral (oscuro)}
        const colores = [
            { f: '#e74c3c', s: '#ff7979', l: '#c0392b' }, // Rojo
            { f: '#f1c40f', s: '#f9e79f', l: '#f39c12' }, // Amarillo
            { f: '#2ecc71', s: '#82e0aa', l: '#27ae60' }, // Verde
            { f: '#3498db', s: '#85c1e9', l: '#2980b9' }, // Azul
            { f: '#9b59b6', s: '#d7bde2', l: '#8e44ad' } // Morado
        ];
        // 2. Dibujamos cada barra del arreglo
        for (let i = 0; i < datos.length; i++) {
            const valor = datos[i];
            // Regla de 3: Calculamos cuántos píxeles de ancho le tocan a esta barra
            const anchoBarra = (valor * anchoMaximoDisponible) / maxValor;
            const posicionY = margenSuperior + i * (altoBarra + espacioEntreBarras);
            // Elegimos un color (el operador % hace que los colores se repitan si hay muchos datos)
            const colorSet = colores[i % colores.length];
            // 3. Dibujamos el texto (el número) a la izquierda de la barra
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(valor.toString(), margenIzquierdo - 35, posicionY + altoBarra / 2 + 5);
            // 4. Mandamos a construir la geometría 3D
            this.dibujarBarra3D(margenIzquierdo, posicionY, anchoBarra, altoBarra, colorSet.f, colorSet.s, colorSet.l);
        }
    }
    // El motor geométrico 3D 🧊
    dibujarBarra3D(x, y, ancho, alto, colorFrente, colorSuperior, colorLateral) {
        const prof = 15; // Profundidad: Cuántos píxeles se inclina hacia atrás y arriba
        // --- Cara Superior ---
        this.ctx.fillStyle = colorSuperior;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y); // Esquina frontal izquierda
        this.ctx.lineTo(x + prof, y - prof); // Atrás izquierda
        this.ctx.lineTo(x + ancho + prof, y - prof); // Atrás derecha
        this.ctx.lineTo(x + ancho, y); // Frontal derecha
        this.ctx.closePath();
        this.ctx.fill();
        // --- Cara Lateral Derecha ---
        this.ctx.fillStyle = colorLateral;
        this.ctx.beginPath();
        this.ctx.moveTo(x + ancho, y); // Esquina frontal superior derecha
        this.ctx.lineTo(x + ancho + prof, y - prof); // Atrás superior derecha
        this.ctx.lineTo(x + ancho + prof, y + alto - prof); // Atrás inferior derecha
        this.ctx.lineTo(x + ancho, y + alto); // Frontal inferior derecha
        this.ctx.closePath();
        this.ctx.fill();
        // --- Cara Frontal (¡El rectángulo tradicional que tapa las uniones!) ---
        this.ctx.fillStyle = colorFrente;
        this.ctx.fillRect(x, y, ancho, alto);
    }
}
