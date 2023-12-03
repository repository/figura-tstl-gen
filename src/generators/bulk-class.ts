import clone from "clone";
import objectHash from "object-hash";
import { Statement } from "typescript";
import { FDClass, FDField } from "../types";
import { BulkGenerator } from "./bulk";
import { ClassGenerator } from "./class";

export class BulkClassGenerator extends BulkGenerator<FDField> {
  private findClassParentsRecursively(cls: FDClass, classes: FDClass[]): FDClass[] {
    if (!cls.parent) {
      return [];
    }

    const parent = classes.find((cls) => cls.name === cls.parent);

    if (!parent) {
      return [];
    }

    return [parent, ...this.findClassParentsRecursively(parent, classes)];
  }

  private removeClassInheritedMembers(cls: FDClass, parents: FDClass[]): FDClass {
    const cleaned = clone(cls);

    const parentMethods = new Set(parents.flatMap((parent) => parent.methods.map((method) => objectHash(method))));
    cleaned.methods = cls.methods.filter((method) => !parentMethods.has(objectHash(method)));

    return cls;
  }

  public generate(): Statement[] {
    const classes = this.elements
      .flatMap((field) => field.children)
      .map((cls, _, classes) => {
        const parents = this.findClassParentsRecursively(cls, classes);

        return this.removeClassInheritedMembers(cls, parents);
      });

    const statements: Statement[] = [];

    for (const cls of classes) {
      const classStatements = new ClassGenerator(this.c, cls).generate();

      statements.push(...classStatements);
    }

    return statements;
  }
}
