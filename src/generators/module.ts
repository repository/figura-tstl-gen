import { ModuleDeclaration, NodeFlags, SyntaxKind } from "typescript";
import { FDClass } from "../types";
import { BaseGenerator } from "./base";
import { ModuleField } from "./module-field";
import { ModuleMethodGenerator } from "./module-method";

export class ModuleGenerator extends BaseGenerator<[global: FDClass], ModuleDeclaration> {
  private generateFields() {
    return this.element.fields.flatMap((field) => new ModuleField(this.c, field, this.element).generate());
  }

  private generateMethods() {
    return this.element.methods.flatMap((method) => new ModuleMethodGenerator(this.c, method, this.element).generate());
  }

  protected getName() {
    if (this.element.name === "globals") {
      return "global";
    }

    return this.element.name;
  }

  protected generateStatements() {
    const fields = this.generateFields();
    const methods = this.generateMethods();

    return this.c.moduleDeclaration(this.getName(), [...fields, ...methods], {
      modifiers: [SyntaxKind.DeclareKeyword],
      flags: this.getName() === "global" ? NodeFlags.GlobalAugmentation : NodeFlags.Namespace,
    });
  }
}
