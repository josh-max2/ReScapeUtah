// Spatial hash grid over the playfield. Rebuilt every tick from enemy positions;
// used for enemy separation and tower targeting. Linked-list buckets in typed
// arrays — zero allocation in the hot loop.

export class SpatialHash {
  readonly cs: number;
  readonly cols: number;
  readonly rows: number;
  readonly heads: Int32Array;
  readonly next: Int32Array;

  constructor(w: number, h: number, cellSize: number, capacity: number) {
    this.cs = cellSize;
    this.cols = Math.ceil(w / cellSize);
    this.rows = Math.ceil(h / cellSize);
    this.heads = new Int32Array(this.cols * this.rows).fill(-1);
    this.next = new Int32Array(capacity);
  }

  clear(): void {
    this.heads.fill(-1);
  }

  insert(i: number, x: number, y: number): void {
    let cx = (x / this.cs) | 0;
    let cy = (y / this.cs) | 0;
    if (cx < 0) cx = 0; else if (cx >= this.cols) cx = this.cols - 1;
    if (cy < 0) cy = 0; else if (cy >= this.rows) cy = this.rows - 1;
    const c = cy * this.cols + cx;
    this.next[i] = this.heads[c];
    this.heads[c] = i;
  }

  /** Visit every item in buckets overlapping the circle. fn returning true stops early. */
  query(x: number, y: number, r: number, fn: (i: number) => boolean | void): void {
    let x0 = ((x - r) / this.cs) | 0;
    let y0 = ((y - r) / this.cs) | 0;
    let x1 = ((x + r) / this.cs) | 0;
    let y1 = ((y + r) / this.cs) | 0;
    if (x0 < 0) x0 = 0;
    if (y0 < 0) y0 = 0;
    if (x1 >= this.cols) x1 = this.cols - 1;
    if (y1 >= this.rows) y1 = this.rows - 1;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        let i = this.heads[cy * this.cols + cx];
        while (i !== -1) {
          if (fn(i) === true) return;
          i = this.next[i];
        }
      }
    }
  }
}
