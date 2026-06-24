import {
  Face3D,
  Model3D,
  ProjectedVertex,
  ProjectionResult
} from './Model3D.js';
import { Point3D } from './Point3D.js';

export type RenderMode = 'wireframe' | 'hidden' | 'zbuffer';

interface Triangle {
  a: number;
  b: number;
  c: number;
  shade: [number, number, number];
}

interface Edge {
  a: number;
  b: number;
}

const FAR_VALUE = Number.NEGATIVE_INFINITY;

function cross2D(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function vectorSubtract(a: Point3D, b: Point3D): Point3D {
  return new Point3D(a.x - b.x, a.y - b.y, a.z - b.z);
}

function cross3D(a: Point3D, b: Point3D): Point3D {
  return new Point3D(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

function length3D(v: Point3D): number {
  return Math.hypot(v.x, v.y, v.z);
}

function normalize3D(v: Point3D): Point3D {
  const magnitude = length3D(v);
  if (magnitude < 1e-9) return new Point3D(0, 0, 1);
  return new Point3D(v.x / magnitude, v.y / magnitude, v.z / magnitude);
}

function dot3D(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function pointInTriangle(
  point: ProjectedVertex,
  a: ProjectedVertex,
  b: ProjectedVertex,
  c: ProjectedVertex
): boolean {
  const d1 = cross2D(
    point.screenX,
    point.screenY,
    a.screenX,
    a.screenY,
    b.screenX,
    b.screenY
  );
  const d2 = cross2D(
    point.screenX,
    point.screenY,
    b.screenX,
    b.screenY,
    c.screenX,
    c.screenY
  );
  const d3 = cross2D(
    point.screenX,
    point.screenY,
    c.screenX,
    c.screenY,
    a.screenX,
    a.screenY
  );

  const hasNegative = d1 < -1e-7 || d2 < -1e-7 || d3 < -1e-7;
  const hasPositive = d1 > 1e-7 || d2 > 1e-7 || d3 > 1e-7;
  return !(hasNegative && hasPositive);
}

function cleanFaceIndices(
  face: Face3D,
  projected: Array<ProjectedVertex | undefined>
): number[] {
  const result: number[] = [];

  for (const rawIndex of face.indices) {
    const index = Math.abs(rawIndex);
    if (projected[index] === undefined) continue;
    if (result[result.length - 1] !== index) result.push(index);
  }

  if (result.length > 1 && result[0] === result[result.length - 1]) {
    result.pop();
  }

  return result;
}

function polygonArea(
  indices: number[],
  projected: Array<ProjectedVertex | undefined>
): number {
  let area = 0;

  for (let index = 0; index < indices.length; index++) {
    const current = projected[indices[index]] as ProjectedVertex;
    const next = projected[indices[(index + 1) % indices.length]] as ProjectedVertex;
    area += current.screenX * next.screenY - next.screenX * current.screenY;
  }

  return area / 2;
}

function triangulateFace(
  face: Face3D,
  projected: Array<ProjectedVertex | undefined>
): Array<[number, number, number]> {
  const indices = cleanFaceIndices(face, projected);
  if (indices.length < 3) return [];
  if (indices.length === 3) return [[indices[0], indices[1], indices[2]]];

  const orientation = polygonArea(indices, projected) >= 0 ? 1 : -1;
  const working = [...indices];
  const triangles: Array<[number, number, number]> = [];
  let guard = working.length * working.length;

  while (working.length > 3 && guard-- > 0) {
    let earFound = false;

    for (let i = 0; i < working.length; i++) {
      const previousIndex = working[(i - 1 + working.length) % working.length];
      const currentIndex = working[i];
      const nextIndex = working[(i + 1) % working.length];

      const previous = projected[previousIndex] as ProjectedVertex;
      const current = projected[currentIndex] as ProjectedVertex;
      const next = projected[nextIndex] as ProjectedVertex;

      const convexity = cross2D(
        previous.screenX,
        previous.screenY,
        current.screenX,
        current.screenY,
        next.screenX,
        next.screenY
      );

      if (convexity * orientation <= 1e-7) continue;

      let containsVertex = false;
      for (const candidateIndex of working) {
        if (
          candidateIndex === previousIndex ||
          candidateIndex === currentIndex ||
          candidateIndex === nextIndex
        ) {
          continue;
        }

        const candidate = projected[candidateIndex] as ProjectedVertex;
        if (pointInTriangle(candidate, previous, current, next)) {
          containsVertex = true;
          break;
        }
      }

      if (containsVertex) continue;

      triangles.push([previousIndex, currentIndex, nextIndex]);
      working.splice(i, 1);
      earFound = true;
      break;
    }

    if (!earFound) break;
  }

  if (working.length === 3) {
    triangles.push([working[0], working[1], working[2]]);
  }

  if (triangles.length !== indices.length - 2) {
    const fallback: Array<[number, number, number]> = [];
    for (let i = 1; i < indices.length - 1; i++) {
      const a = projected[indices[0]] as ProjectedVertex;
      const b = projected[indices[i]] as ProjectedVertex;
      const c = projected[indices[i + 1]] as ProjectedVertex;
      if (
        Math.abs(
          cross2D(
            a.screenX,
            a.screenY,
            b.screenX,
            b.screenY,
            c.screenX,
            c.screenY
          )
        ) > 1e-7
      ) {
        fallback.push([indices[0], indices[i], indices[i + 1]]);
      }
    }
    return fallback;
  }

  return triangles;
}

function faceShade(
  indices: number[],
  projected: Array<ProjectedVertex | undefined>
): [number, number, number] {
  if (indices.length < 3) return [92, 118, 148];

  let normal = new Point3D(0, 0, 1);
  for (let i = 1; i < indices.length - 1; i++) {
    const a = (projected[indices[0]] as ProjectedVertex).eye;
    const b = (projected[indices[i]] as ProjectedVertex).eye;
    const c = (projected[indices[i + 1]] as ProjectedVertex).eye;
    const candidate = cross3D(vectorSubtract(b, a), vectorSubtract(c, a));

    if (length3D(candidate) > 1e-7) {
      normal = normalize3D(candidate);
      break;
    }
  }

  const light = normalize3D(new Point3D(-0.45, -0.65, 1));
  const diffuse = Math.abs(dot3D(normal, light));
  const intensity = 0.28 + diffuse * 0.72;

  return [
    Math.round(45 + 74 * intensity),
    Math.round(77 + 91 * intensity),
    Math.round(108 + 104 * intensity)
  ];
}

export class SoftwareRenderer {
  private depthBuffer = new Float32Array(0);
  private bufferWidth = 0;
  private bufferHeight = 0;
  private imageData: ImageData | null = null;

  render(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    model: Model3D,
    mode: RenderMode
  ): void {
    const width = canvas.width;
    const height = canvas.height;
    const projection = model.project(width, height);

    context.clearRect(0, 0, width, height);
    context.lineJoin = 'round';
    context.lineCap = 'round';

    const edges = this.collectEdges(model.getFaces(), projection);

    if (mode === 'wireframe') {
      this.drawWireframe(context, edges, projection);
      return;
    }

    const triangles = this.collectTriangles(model.getFaces(), projection);
    this.ensureDepthBuffer(width, height);
    this.depthBuffer.fill(FAR_VALUE);

    if (mode === 'hidden') {
      this.rasterizeDepth(triangles, projection, undefined);
      this.drawDepthTestedEdges(context, edges, projection, '#263443', 1.25);
      return;
    }

    if (
      this.imageData === null ||
      this.imageData.width !== width ||
      this.imageData.height !== height
    ) {
      this.imageData = context.createImageData(width, height);
    } else {
      this.imageData.data.fill(0);
    }

    this.rasterizeDepth(triangles, projection, this.imageData.data);
    context.putImageData(this.imageData, 0, 0);
    this.drawDepthTestedEdges(context, edges, projection, 'rgba(17, 35, 52, 0.72)', 0.9);
  }

  private ensureDepthBuffer(width: number, height: number): void {
    if (
      this.bufferWidth !== width ||
      this.bufferHeight !== height ||
      this.depthBuffer.length !== width * height
    ) {
      this.bufferWidth = width;
      this.bufferHeight = height;
      this.depthBuffer = new Float32Array(width * height);
    }
  }

  private collectTriangles(
    faces: readonly Face3D[],
    projection: ProjectionResult
  ): Triangle[] {
    const triangles: Triangle[] = [];

    for (const face of faces) {
      const cleanIndices = cleanFaceIndices(face, projection.vertices);
      if (cleanIndices.length < 3) continue;

      const shade = faceShade(cleanIndices, projection.vertices);
      for (const [a, b, c] of triangulateFace(face, projection.vertices)) {
        triangles.push({ a, b, c, shade });
      }
    }

    return triangles;
  }

  private collectEdges(
    faces: readonly Face3D[],
    projection: ProjectionResult
  ): Edge[] {
    const edges = new Map<string, Edge>();

    const addEdge = (a: number, b: number): void => {
      if (a === b || projection.vertices[a] === undefined || projection.vertices[b] === undefined) {
        return;
      }
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      edges.set(`${min}:${max}`, { a, b });
    };

    for (const face of faces) {
      if (face.indices.length < 2) continue;

      let previous = Math.abs(face.indices[face.indices.length - 1]);
      for (const signedCurrent of face.indices) {
        const current = Math.abs(signedCurrent);
        if (signedCurrent > 0) addEdge(previous, current);
        previous = current;
      }
    }

    return [...edges.values()];
  }

  private drawWireframe(
    context: CanvasRenderingContext2D,
    edges: Edge[],
    projection: ProjectionResult
  ): void {
    context.strokeStyle = '#263443';
    context.lineWidth = 1.2;
    context.beginPath();

    for (const edge of edges) {
      const a = projection.vertices[edge.a];
      const b = projection.vertices[edge.b];
      if (a === undefined || b === undefined) continue;
      context.moveTo(a.screenX, a.screenY);
      context.lineTo(b.screenX, b.screenY);
    }

    context.stroke();
  }

  private rasterizeDepth(
    triangles: Triangle[],
    projection: ProjectionResult,
    pixels: Uint8ClampedArray | undefined
  ): void {
    const width = projection.width;
    const height = projection.height;

    for (const triangle of triangles) {
      const a = projection.vertices[triangle.a];
      const b = projection.vertices[triangle.b];
      const c = projection.vertices[triangle.c];
      if (a === undefined || b === undefined || c === undefined) continue;

      const area = cross2D(
        a.screenX,
        a.screenY,
        b.screenX,
        b.screenY,
        c.screenX,
        c.screenY
      );
      if (Math.abs(area) < 1e-8) continue;

      const minX = Math.max(0, Math.floor(Math.min(a.screenX, b.screenX, c.screenX)));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(a.screenX, b.screenX, c.screenX)));
      const minY = Math.max(0, Math.floor(Math.min(a.screenY, b.screenY, c.screenY)));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(a.screenY, b.screenY, c.screenY)));

      for (let y = minY; y <= maxY; y++) {
        const sampleY = y + 0.5;

        for (let x = minX; x <= maxX; x++) {
          const sampleX = x + 0.5;
          const wA = cross2D(
            b.screenX,
            b.screenY,
            c.screenX,
            c.screenY,
            sampleX,
            sampleY
          ) / area;
          const wB = cross2D(
            c.screenX,
            c.screenY,
            a.screenX,
            a.screenY,
            sampleX,
            sampleY
          ) / area;
          const wC = 1 - wA - wB;

          if (wA < -1e-5 || wB < -1e-5 || wC < -1e-5) continue;

          const invDepth =
            wA * a.invDepth +
            wB * b.invDepth +
            wC * c.invDepth;
          const bufferIndex = y * width + x;

          if (invDepth <= this.depthBuffer[bufferIndex]) continue;
          this.depthBuffer[bufferIndex] = invDepth;

          if (pixels !== undefined) {
            const pixelIndex = bufferIndex * 4;
            pixels[pixelIndex] = triangle.shade[0];
            pixels[pixelIndex + 1] = triangle.shade[1];
            pixels[pixelIndex + 2] = triangle.shade[2];
            pixels[pixelIndex + 3] = 255;
          }
        }
      }
    }
  }

  private maxNeighborDepth(x: number, y: number): number {
    let maximum = FAR_VALUE;

    for (let offsetY = -1; offsetY <= 1; offsetY++) {
      const sampleY = y + offsetY;
      if (sampleY < 0 || sampleY >= this.bufferHeight) continue;

      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        const sampleX = x + offsetX;
        if (sampleX < 0 || sampleX >= this.bufferWidth) continue;
        maximum = Math.max(
          maximum,
          this.depthBuffer[sampleY * this.bufferWidth + sampleX]
        );
      }
    }

    return maximum;
  }

  private drawDepthTestedEdges(
    context: CanvasRenderingContext2D,
    edges: Edge[],
    projection: ProjectionResult,
    strokeStyle: string,
    lineWidth: number
  ): void {
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.beginPath();

    for (const edge of edges) {
      const a = projection.vertices[edge.a];
      const b = projection.vertices[edge.b];
      if (a === undefined || b === undefined) continue;

      const deltaX = b.screenX - a.screenX;
      const deltaY = b.screenY - a.screenY;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY))));
      let drawing = false;

      for (let step = 0; step <= steps; step++) {
        const factor = step / steps;
        const x = a.screenX + deltaX * factor;
        const y = a.screenY + deltaY * factor;
        const pixelX = Math.round(x);
        const pixelY = Math.round(y);

        if (
          pixelX < 0 ||
          pixelX >= projection.width ||
          pixelY < 0 ||
          pixelY >= projection.height
        ) {
          drawing = false;
          continue;
        }

        const edgeInvDepth = a.invDepth + (b.invDepth - a.invDepth) * factor;
        const surfaceInvDepth = this.maxNeighborDepth(pixelX, pixelY);
        const epsilon = Math.max(1e-5, edgeInvDepth * 0.018);
        const visible =
          surfaceInvDepth === FAR_VALUE ||
          edgeInvDepth >= surfaceInvDepth - epsilon;

        if (visible) {
          if (!drawing) context.moveTo(x, y);
          else context.lineTo(x, y);
          drawing = true;
        } else {
          drawing = false;
        }
      }
    }

    context.stroke();
  }
}
