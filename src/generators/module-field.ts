import { VariableStatement } from "typescript";
import { C, TypeNodeInput } from "../c";
import { KeywordTypeNode } from "../sk";
import { FDClass, FDField } from "../types";
import { BaseGenerator } from "./base";

type Context = [field: FDField, klass: FDClass];

export class ModuleField extends BaseGenerator<Context, VariableStatement> {
  private readonly klass: FDClass;

  constructor(
    protected readonly c: C,
    ...[method, klass]: Context
  ) {
    super(c, method, klass);

    this.klass = klass;
  }

  private getType(): TypeNodeInput {
    if (this.klass.name === "globals") {
      if (this.getName() === "vec") {
        return this.c.intersectionTypeNode([
          this.c.functionTypeNode(
            [
              ["x", KeywordTypeNode.Number],
              ["y", KeywordTypeNode.Number],
            ],
            "Vector2",
          ),
          this.c.functionTypeNode(
            [
              ["x", KeywordTypeNode.Number],
              ["y", KeywordTypeNode.Number],
              ["z", KeywordTypeNode.Number],
            ],
            "Vector3",
          ),
          this.c.functionTypeNode(
            [
              ["x", KeywordTypeNode.Number],
              ["y", KeywordTypeNode.Number],
              ["z", KeywordTypeNode.Number],
              ["w", KeywordTypeNode.Number],
            ],
            "Vector4",
          ),
        ]);
      }
    }

    return this.element.type;
  }

  protected generateStatements() {
    return this.c.variableDeclaration(this.getName(), this.getType());
  }
}
