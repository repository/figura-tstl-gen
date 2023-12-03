import { Identifier, Node } from "typescript";
import { C } from "../c";
import { FDBase } from "../types";

export abstract class BaseGenerator<T extends FDBase[], R extends Node, P extends Node = R, F extends Node = R> {
  protected readonly declarations: Record<string, string> = {};

  protected readonly element: T[0];
  protected readonly context: T;

  protected postConstructor(): void {}

  constructor(
    protected readonly c: C,
    ...context: T
  ) {
    this.element = context[0];
    this.context = context;

    this.postConstructor();
  }

  protected getName(): string {
    return this.element.name;
  }

  protected getNameAsIdentifier(): Identifier {
    return this.c.identifier(this.getName());
  }

  protected getDescription(): string {
    return this.element.description ?? "";
  }

  protected getCommentText(): string {
    return this.getDescription();
  }

  protected setDeclaration(name: string, value = ""): void {
    this.declarations[name] = value;
  }

  protected getDeclarationsFormatted(): string[] {
    const formatted = Object.entries(this.declarations).map(([name, value]) => `@${name} ${value}`.trim());

    if (formatted.length === 0) {
      return [];
    } else {
      return ["", ...formatted];
    }
  }

  protected addComment<T extends Node>(statement: T): T {
    const formattedLines = [...this.getCommentText().split("\n"), ...this.getDeclarationsFormatted()]
      .map((line) => ` * ${line.trim()}`)
      .join("\n");

    const fullText = `*\n${formattedLines}\n `;

    return this.c.addComment(fullText, statement);
  }

  protected abstract generateStatements(): R[] | R;

  protected generatePrecedingStatements(): P[] {
    return [];
  }

  protected generateFollowingStatements(): F[] {
    return [];
  }

  public generate(): (R | P | F)[] {
    const mainStatements = this.generateStatements();
    let mainStatementsArray: R[] = Array.isArray(mainStatements) ? mainStatements : [mainStatements];

    mainStatementsArray = mainStatementsArray.map((statement) => this.addComment(statement));

    return [...this.generatePrecedingStatements(), ...mainStatementsArray, ...this.generateFollowingStatements()];
  }
}
