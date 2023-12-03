import { FunctionDeclaration } from "typescript";
import { C, ParameterDeclarationInput, TypeNodeInput } from "../c";
import { KeywordTypeNode } from "../sk";
import { FDClass, FDMethod, FDParameter } from "../types";
import { BaseGenerator } from "./base";

type Context = [method: FDMethod, klass: FDClass];

export class ModuleMethodGenerator extends BaseGenerator<Context, FunctionDeclaration> {
  private readonly klass: FDClass;

  constructor(
    protected readonly c: C,
    ...[method, klass]: Context
  ) {
    super(c, method, klass);

    this.klass = klass;
  }

  private generateLerp() {
    return this.c.functionDeclaration(
      "lerp",
      [
        ["start", "T"],
        ["end", "T"],
        ["t", KeywordTypeNode.Number],
      ],
      "T",
      {
        typeParameters: [
          [
            "T",
            this.c.unionTypeNode([
              KeywordTypeNode.Number,
              "Vector2",
              "Vector3",
              "Vector4",
              "Matrix2",
              "Matrix3",
              "Matrix4",
            ]),
          ],
        ],
      },
    );
  }

  private getParameter(param: FDParameter, params: FDParameter[], returnType: string): ParameterDeclarationInput {
    const type: TypeNodeInput = param.type;

    return [param.name, type];
  }

  private getReturn(returnType: string, params: FDParameter[]): TypeNodeInput {
    return returnType;
  }

  protected generateStatements() {
    if (this.getName() === "lerp") {
      return this.generateLerp();
    }

    const pairs = this.element.parameters.map((params, index) => {
      const returnType = this.element.returns[index];

      return [params, returnType] as const;
    });

    const names = [this.getName(), ...this.element.aliases];

    return names.flatMap((name) =>
      pairs.map(([params, returnType]) =>
        this.c.functionDeclaration(
          name,
          params.map((param) => this.getParameter(param, params, returnType)),
          this.getReturn(returnType, params),
        ),
      ),
    );
  }
}
