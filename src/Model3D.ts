import { Point3D } from './Point3D.js';

export interface Face3D {
  indices: number[];
}

export interface PieceInfo {
  name: string;
  indices: number[];
  centroid: Point3D;
  direction: Point3D;
}

export interface ProjectedVertex {
  screenX: number;
  screenY: number;
  depth: number;
  invDepth: number;
  eye: Point3D;
  world: Point3D;
}

export interface ProjectionResult {
  vertices: Array<ProjectedVertex | undefined>;
  width: number;
  height: number;
}

interface Transform3D {
  translation: Point3D;
  rotation: Point3D;
}

const EPSILON = 1e-9;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function add(a: Point3D, b: Point3D): Point3D {
  return new Point3D(a.x + b.x, a.y + b.y, a.z + b.z);
}

function subtract(a: Point3D, b: Point3D): Point3D {
  return new Point3D(a.x - b.x, a.y - b.y, a.z - b.z);
}

function scale(v: Point3D, factor: number): Point3D {
  return new Point3D(v.x * factor, v.y * factor, v.z * factor);
}

function length(v: Point3D): number {
  return Math.hypot(v.x, v.y, v.z);
}

function normalize(v: Point3D): Point3D {
  const magnitude = length(v);
  if (magnitude < EPSILON) {
    return new Point3D(0, 0, 0);
  }
  return scale(v, 1 / magnitude);
}

function rotateEuler(point: Point3D, rotation: Point3D): Point3D {
  let x = point.x;
  let y = point.y;
  let z = point.z;

  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];

  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  [x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY];

  const cosZ = Math.cos(rotation.z);
  const sinZ = Math.sin(rotation.z);
  [x, y] = [x * cosZ - y * sinZ, x * sinZ + y * cosZ];

  return new Point3D(x, y, z);
}

function createTransform(): Transform3D {
  return {
    translation: new Point3D(0, 0, 0),
    rotation: new Point3D(0, 0, 0)
  };
}

export class Model3D {
  private baseVertices: Array<Point3D | undefined> = [];
  private faces: Face3D[] = [];
  private pieces: PieceInfo[] = [];
  private indexToPiece = new Map<number, number>();
  private pieceTransforms: Transform3D[] = [];
  private modelTransform: Transform3D = createTransform();
  private separation = 0;

  readonly camera = {
    theta: 0.45,
    phi: 1.18,
    rho: 10,
    defaultTheta: 0.45,
    defaultPhi: 1.18,
    defaultRho: 10
  };

  private radius = 1;
  private sourceName = 'Sin modelo';

  loadFromText(text: string, sourceName = 'Modelo cargado'): void {
    const lines = text.replace(/\r/g, '').split('\n');
    const facesLine = lines.findIndex((line) => /^\s*faces\s*:/i.test(line));

    if (facesLine < 0) {
      throw new Error('El archivo no contiene la sección "Faces:".');
    }

    const vertices: Array<Point3D | undefined> = [];
    let vertexCount = 0;

    for (const rawLine of lines.slice(0, facesLine)) {
      const line = rawLine.replace(/\/\/.*$/, '').trim();
      if (!line) continue;

      const parts = line.split(/\s+/);
      if (parts.length < 4) continue;

      const index = Number.parseInt(parts[0], 10);
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);

      if (!Number.isInteger(index) || index <= 0 || ![x, y, z].every(Number.isFinite)) {
        continue;
      }

      if (vertices[index] === undefined) vertexCount++;
      vertices[index] = new Point3D(x, y, z);
    }

    if (vertexCount < 2) {
      throw new Error('No se encontraron vértices válidos.');
    }

    const faceSource = lines.slice(facesLine + 1).join('\n');
    const parsedFaces: Face3D[] = [];
    const facePattern = /([^.#]+)[.#]/g;
    let match: RegExpExecArray | null;

    while ((match = facePattern.exec(faceSource)) !== null) {
      const numbers = match[1].match(/-?\d+/g)?.map(Number) ?? [];
      const valid = numbers.filter((value) => {
        const index = Math.abs(value);
        return index > 0 && vertices[index] !== undefined;
      });

      if (valid.length >= 2) {
        parsedFaces.push({ indices: valid });
      }
    }

    if (parsedFaces.length === 0) {
      throw new Error('No se encontraron caras o aristas válidas.');
    }

    const definedVertices = vertices.filter((vertex): vertex is Point3D => vertex !== undefined);
    const min = new Point3D(
      Math.min(...definedVertices.map((vertex) => vertex.x)),
      Math.min(...definedVertices.map((vertex) => vertex.y)),
      Math.min(...definedVertices.map((vertex) => vertex.z))
    );
    const max = new Point3D(
      Math.max(...definedVertices.map((vertex) => vertex.x)),
      Math.max(...definedVertices.map((vertex) => vertex.y)),
      Math.max(...definedVertices.map((vertex) => vertex.z))
    );
    const center = scale(add(min, max), 0.5);

    this.baseVertices = vertices.map((vertex) => (
      vertex === undefined ? undefined : subtract(vertex, center)
    ));
    this.faces = parsedFaces;
    this.radius = Math.max(
      1,
      ...this.baseVertices
        .filter((vertex): vertex is Point3D => vertex !== undefined)
        .map((vertex) => length(vertex))
    );
    this.sourceName = sourceName;

    this.detectPieces();
    this.resetAllTransforms();
    this.camera.defaultRho = this.radius * 3.1;
    this.resetView();
  }

  private detectPieces(): void {
    const vertexIndices = this.baseVertices
      .map((vertex, index) => vertex === undefined ? -1 : index)
      .filter((index) => index > 0);

    const adjacency = new Map<number, Set<number>>();
    for (const index of vertexIndices) adjacency.set(index, new Set<number>());

    for (const face of this.faces) {
      const indices = face.indices.map(Math.abs);
      for (let i = 0; i < indices.length; i++) {
        const current = indices[i];
        const next = indices[(i + 1) % indices.length];
        if (current === next) continue;
        adjacency.get(current)?.add(next);
        adjacency.get(next)?.add(current);
      }
    }

    const visited = new Set<number>();
    const components: number[][] = [];

    for (const start of vertexIndices) {
      if (visited.has(start)) continue;
      const queue = [start];
      const component: number[] = [];
      visited.add(start);

      while (queue.length > 0) {
        const current = queue.shift() as number;
        component.push(current);
        for (const neighbor of adjacency.get(current) ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      components.push(component.sort((a, b) => a - b));
    }

    const sortedIndices = [...vertexIndices].sort((a, b) => a - b);
    const numericRuns: number[][] = [];
    let currentRun: number[] = [];

    for (const index of sortedIndices) {
      const previous = currentRun[currentRun.length - 1];
      if (currentRun.length > 0 && index - previous > 5) {
        numericRuns.push(currentRun);
        currentRun = [];
      }
      currentRun.push(index);
    }
    if (currentRun.length > 0) numericRuns.push(currentRun);

    let groups = components;
    if (
      (components.length === 1 || components.length > 12) &&
      numericRuns.length > 1 &&
      numericRuns.every((run) => run.length >= 2)
    ) {
      groups = numericRuns;
    }

    groups.sort((a, b) => a[0] - b[0]);

    const globalCentroid = this.computeCentroid(vertexIndices);
    this.pieces = groups.map((indices, pieceIndex) => {
      const centroid = this.computeCentroid(indices);
      let direction = normalize(subtract(centroid, globalCentroid));

      if (length(direction) < EPSILON) {
        const angle = (pieceIndex / Math.max(1, groups.length)) * Math.PI * 2;
        direction = normalize(new Point3D(Math.cos(angle), Math.sin(angle), 0.35));
      }

      const first = indices[0];
      const last = indices[indices.length - 1];
      return {
        name: `Pieza ${pieceIndex + 1} · vértices ${first}–${last}`,
        indices,
        centroid,
        direction
      };
    });

    this.indexToPiece.clear();
    this.pieces.forEach((piece, pieceIndex) => {
      piece.indices.forEach((index) => this.indexToPiece.set(index, pieceIndex));
    });
    this.pieceTransforms = this.pieces.map(() => createTransform());
  }

  private computeCentroid(indices: number[]): Point3D {
    let count = 0;
    const total = new Point3D(0, 0, 0);

    for (const index of indices) {
      const vertex = this.baseVertices[index];
      if (vertex === undefined) continue;
      total.x += vertex.x;
      total.y += vertex.y;
      total.z += vertex.z;
      count++;
    }

    return count === 0 ? total : scale(total, 1 / count);
  }

  getFaces(): readonly Face3D[] {
    return this.faces;
  }

  getPieces(): readonly PieceInfo[] {
    return this.pieces;
  }

  getRadius(): number {
    return this.radius;
  }

  getSourceName(): string {
    return this.sourceName;
  }

  getVertexCount(): number {
    return this.baseVertices.filter((vertex) => vertex !== undefined).length;
  }

  getFaceCount(): number {
    return this.faces.length;
  }

  getSeparation(): number {
    return this.separation;
  }

  setSeparation(amount: number): void {
    this.separation = clamp(amount, 0, this.radius * 2.5);
  }

  translateModel(dx: number, dy: number, dz: number): void {
    this.modelTransform.translation.x += dx;
    this.modelTransform.translation.y += dy;
    this.modelTransform.translation.z += dz;
  }

  rotateModel(axis: 'x' | 'y' | 'z', radians: number): void {
    this.modelTransform.rotation[axis] += radians;
  }

  translatePiece(pieceIndex: number, dx: number, dy: number, dz: number): void {
    const transform = this.pieceTransforms[pieceIndex];
    if (!transform) return;
    transform.translation.x += dx;
    transform.translation.y += dy;
    transform.translation.z += dz;
  }

  rotatePiece(pieceIndex: number, axis: 'x' | 'y' | 'z', radians: number): void {
    const transform = this.pieceTransforms[pieceIndex];
    if (!transform) return;
    transform.rotation[axis] += radians;
  }

  resetPiece(pieceIndex: number): void {
    if (!this.pieceTransforms[pieceIndex]) return;
    this.pieceTransforms[pieceIndex] = createTransform();
  }

  resetModelTransform(): void {
    this.modelTransform = createTransform();
  }

  resetAllTransforms(): void {
    this.modelTransform = createTransform();
    this.pieceTransforms = this.pieces.map(() => createTransform());
    this.separation = 0;
  }

  resetView(): void {
    this.camera.theta = this.camera.defaultTheta;
    this.camera.phi = this.camera.defaultPhi;
    this.camera.rho = this.camera.defaultRho;
  }

  orbitCamera(deltaTheta: number, deltaPhi: number): void {
    this.camera.theta += deltaTheta;
    this.camera.phi = clamp(this.camera.phi + deltaPhi, 0.08, Math.PI - 0.08);
  }

  zoomCamera(factor: number): void {
    this.camera.rho = clamp(
      this.camera.rho * factor,
      this.radius * 1.25,
      this.radius * 80
    );
  }

  private transformedVertex(index: number): Point3D | undefined {
    const base = this.baseVertices[index];
    if (base === undefined) return undefined;

    const pieceIndex = this.indexToPiece.get(index) ?? 0;
    const piece = this.pieces[pieceIndex];
    const pieceTransform = this.pieceTransforms[pieceIndex] ?? createTransform();

    const relative = subtract(base, piece.centroid);
    let point = rotateEuler(relative, pieceTransform.rotation);
    point = add(point, piece.centroid);
    point = add(point, pieceTransform.translation);
    point = add(point, scale(piece.direction, this.separation));

    point = rotateEuler(point, this.modelTransform.rotation);
    point = add(point, this.modelTransform.translation);
    return point;
  }

  project(width: number, height: number): ProjectionResult {
    const projected: Array<ProjectedVertex | undefined> = new Array(this.baseVertices.length);
    const theta = this.camera.theta;
    const phi = this.camera.phi;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const focalLength = Math.min(width, height) * 1.15;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let index = 1; index < this.baseVertices.length; index++) {
      const world = this.transformedVertex(index);
      if (world === undefined) continue;

      const eyeX = -sinTheta * world.x + cosTheta * world.y;
      const eyeY =
        -cosPhi * cosTheta * world.x -
        cosPhi * sinTheta * world.y +
        sinPhi * world.z;
      const eyeZ =
        sinPhi * cosTheta * world.x +
        sinPhi * sinTheta * world.y +
        cosPhi * world.z -
        this.camera.rho;

      const depth = -eyeZ;
      if (depth <= 0.01) continue;

      projected[index] = {
        screenX: centerX + focalLength * (eyeX / depth),
        screenY: centerY - focalLength * (eyeY / depth),
        depth,
        invDepth: 1 / depth,
        eye: new Point3D(eyeX, eyeY, eyeZ),
        world
      };
    }

    return { vertices: projected, width, height };
  }
}
