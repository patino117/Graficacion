export class Point3D {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}

  clone(): Point3D {
    return new Point3D(this.x, this.y, this.z);
  }
}
