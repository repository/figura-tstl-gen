import { PropertySignature } from "typescript";
import { C, TypeNodeInput } from "../c";
import { KeywordTypeNode } from "../sk";
import { FDClass, FDField } from "../types";
import { BaseGenerator } from "./base";

type Context = [element: FDField, klass: FDClass];

export class ClassFieldGenerator extends BaseGenerator<Context, PropertySignature> {
  private readonly klass: FDClass;

  constructor(
    protected readonly c: C,
    ...[element, klass]: Context
  ) {
    super(c, element, klass);

    this.klass = klass;
  }

  private getReturnType(): TypeNodeInput {
    if (this.element.type === "Function") {
      if (this.klass.name === "ActionWheelAPI") {
        if (["leftClick", "rightClick"].includes(this.getName())) {
          return this.c.functionTypeNode([], KeywordTypeNode.Void);
        }

        if (["scroll"].includes(this.getName())) {
          return this.c.functionTypeNode([["delta", KeywordTypeNode.Number]], KeywordTypeNode.Void);
        }
      }

      if (this.klass.name === "Action") {
        if (["leftClick", "rightClick"].includes(this.getName())) {
          return this.c.functionTypeNode([["action", "Action"]], KeywordTypeNode.Void);
        }

        if (["toggle", "untoggle"].includes(this.getName())) {
          return this.c.functionTypeNode(
            [
              ["state", KeywordTypeNode.Boolean],
              ["action", "Action"],
            ],
            KeywordTypeNode.Void,
          );
        }

        if (["scroll"].includes(this.getName())) {
          return this.c.functionTypeNode(
            [
              ["delta", KeywordTypeNode.Number],
              ["action", "Action"],
            ],
            KeywordTypeNode.Void,
          );
        }
      }

      if (this.klass.name === "ModelPart") {
        if (["preRender", "midRender", "postRender"].includes(this.getName())) {
          return this.c.functionTypeNode([], KeywordTypeNode.Void);
        }
      }

      if (this.klass.name === "Keybind") {
        if (["press", "release"].includes(this.getName())) {
          return this.c.functionTypeNode(
            [
              ["modifiersBitmask", KeywordTypeNode.Number],
              ["keybind", "Keybind"],
            ],
            KeywordTypeNode.Void,
          );
        }
      }
    }

    return this.element.type;
  }

  protected generateStatements() {
    return this.c.propertySignature(this.getName(), this.getReturnType());
  }
}
