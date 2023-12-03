import { Statement } from "typescript";
import { C } from "../c";
import { FDBase } from "../types";

export abstract class BulkGenerator<T extends FDBase> {
  constructor(
    protected readonly c: C,
    protected readonly elements: T[],
  ) {}

  public abstract generate(): Statement[];
}
