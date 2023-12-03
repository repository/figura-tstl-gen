import { InterfaceDeclaration, MethodSignature, PropertySignature, Statement, SyntaxKind } from "typescript";
import { KeywordTypeNode } from "../sk";
import { FDClass } from "../types";
import { BaseGenerator } from "./base";
import { ClassFieldGenerator } from "./class-field";
import { ClassMethodGenerator } from "./class-method";

export class ClassGenerator extends BaseGenerator<[class_: FDClass], InterfaceDeclaration, Statement> {
  private generateMethodSignatures(): MethodSignature[] {
    return this.element.methods.flatMap((method) => new ClassMethodGenerator(this.c, method, this.element).generate());
  }

  private generatePropertySignatures(): PropertySignature[] {
    return this.element.fields.flatMap((field) => new ClassFieldGenerator(this.c, field, this.element).generate());
  }

  private generateMainInterface(name: string, declare = true) {
    const methods = this.generateMethodSignatures();
    const fields = this.generatePropertySignatures();

    return this.c.interfaceDeclaration(name, [...methods, ...fields], {
      modifiers: declare ? [SyntaxKind.DeclareKeyword] : [],
      extends: this.element.parent ? [this.element.parent] : [],
    });
  }

  protected generatePrecedingStatements() {
    const statements: Statement[] = [];

    if (this.getName() === "ModelPart") {
      statements.push(this.generateMainInterface("ModelPartAPI", false));
    }

    return statements;
  }

  protected generateStatements() {
    if (this.getName() === "ModelPart") {
      return this.c.interfaceDeclaration(
        this.getName(),
        [this.c.indexSignature(["key", KeywordTypeNode.String], "ModelPart")],
        { modifiers: [SyntaxKind.DeclareKeyword], extends: ["ModelPartAPI"] },
      );
    }

    return this.generateMainInterface(this.getName());
  }
}
