import { assert } from "./Errors";
import { Matrix, MatrixField } from "./Matrix";

export type CayleyGraph = [GroupElement, number[]][];

export class Group {
  readonly gens: GroupElement[];
  readonly id: GroupElement;
  private readonly dim: number;
  private readonly fp: MatrixField;
  readonly elements: Map<string, GroupElement>;

  constructor(matrep: Matrix[]) {
    assert(matrep.length > 0, "Matrix has no generators");
    assert(
      matrep.every((m) => m.dim == matrep[0]!.dim),
      "Generators are matrices of different size"
    );
    assert(
      matrep.every((m) => m.fp == matrep[0]!.fp),
      "Generators are matrices of different fp"
    );
    this.gens = matrep.map((m) => new GroupElement(this, m));
    this.dim = matrep[0]!.dim;
    this.fp = matrep[0]!.fp;
    this.id = new GroupElement(this, Matrix.id(this.dim, this.fp));

    this.elements = new Map();
    this.gens.forEach((g) => this.elements.set(g.key(), g));
    this.elements.set(this.id.key(), this.id);
  }

  get ngen(): number {
    return this.gens.length;
  }

  get cayley(): CayleyGraph {
    const graph: CayleyGraph = [[this.id, []]];
    const visited: GroupElement[] = [this.id];
    const visitedMap: Map<string, number> = new Map([[this.id.key(), 0]]);
    const stack: number[] = [0];
    while (stack.length > 0) {
      const nidx = stack.pop()!;
      const [e, cs] = graph[nidx]!;

      this.gens.forEach((g) => {
        // left multiplication
        const h = g.mul(e);
        const idx = visitedMap.get(h.key());
        if (idx === undefined) {
          cs.push(graph.length);
          stack.push(graph.length);
          visited.push(h);
          visitedMap.set(h.key(), visited.length - 1);
          graph.push([h, []]);
          return;
        }
        cs.push(idx);
      });
    }
    return graph;
  }
}

export class GroupElement {
  constructor(readonly grp: Group, readonly mat: Matrix) {}

  key(): string {
    return JSON.stringify(this.mat.mat);
  }

  mul(o: GroupElement): GroupElement {
    assert(this.grp == o.grp, "Multiplying elements of different groups");

    const g = new GroupElement(this.grp, this.mat.mul(o.mat));
    const existing = this.grp.elements.get(g.key());
    if (existing !== undefined) return existing;

    this.grp.elements.set(g.key(), g);
    return g;
  }

}
