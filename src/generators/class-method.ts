import { MethodSignature } from "typescript";
import { C, ParameterDeclarationInput, TypeNodeInput } from "../c";
import { KeywordTypeNode } from "../sk";
import { FDClass, FDMethod, FDParameter } from "../types";
import { BaseGenerator } from "./base";

type Context = [method: FDMethod, klass: FDClass];

export class ClassMethodGenerator extends BaseGenerator<Context, MethodSignature> {
  private readonly klass: FDClass;

  constructor(
    protected readonly c: C,
    ...[method, klass]: Context
  ) {
    super(c, method, klass);

    this.klass = klass;
  }

  private getParameter(param: FDParameter, params: FDParameter[], returnType: string): ParameterDeclarationInput {
    let type: TypeNodeInput = param.type;

    if (param.type === "Function") {
      if (this.klass.name === "Action") {
        if (["setOnLeftClick", "setOnRightClick"].includes(this.getName())) {
          type = this.c.functionTypeNode([["action", "Action"]], KeywordTypeNode.Void);
        }

        if (["setOnToggle", "setOnUntoggle"].includes(this.getName())) {
          type = this.c.functionTypeNode(
            [
              ["state", KeywordTypeNode.Boolean],
              ["action", "Action"],
            ],
            KeywordTypeNode.Void,
          );
        }

        if (["setOnScroll"].includes(this.getName())) {
          type = this.c.functionTypeNode(
            [
              ["delta", KeywordTypeNode.Number],
              ["action", "Action"],
            ],
            KeywordTypeNode.Void,
          );
        }
      }

      if (this.klass.name === "Event") {
        if (["remove", "register"].includes(this.getName())) {
          type = this.c.functionTypeNode([], KeywordTypeNode.Void);
        }
      }

      if (this.klass.name === "ModelPart") {
        if (["setPreRender", "setMidRender", "setPostRender"].includes(this.getName())) {
          type = this.c.functionTypeNode([], KeywordTypeNode.Void);
        }
      }

      if (this.klass.name === "Keybind") {
        if (["setOnPress", "setOnRelease"].includes(this.getName())) {
          type = this.c.functionTypeNode(
            [
              ["modifiersBitmask", KeywordTypeNode.Number],
              ["keybind", "Keybind"],
            ],
            KeywordTypeNode.Void,
          );
        }
      }

      if (this.klass.name === "Texture") {
        if (this.getName() === "applyFunc") {
          type = this.c.functionTypeNode(
            [
              ["color", "Vector4"],
              ["x", KeywordTypeNode.Number],
              ["y", KeywordTypeNode.Number],
            ],
            this.c.unionTypeNode("Vector4", KeywordTypeNode.Undefined),
          );
        }
      }

      if (["Vector2", "Vector3", "Vector4"].includes(this.klass.name)) {
        if (this.getName() === "applyFunc") {
          type = this.c.functionTypeNode(
            [
              ["element", KeywordTypeNode.Number],
              ["index", KeywordTypeNode.Number],
            ],
            KeywordTypeNode.Number,
          );
        }
      }
    }

    return [param.name, type];
  }

  private getReturn(returnType: string, params: FDParameter[]): TypeNodeInput {
    if (this.klass.name === "ActionWheelAPI") {
      if (this.getName() === "getPage") {
        if (returnType === "Table") {
          return this.c.luaMap(KeywordTypeNode.String, "Page");
        } else {
          return this.c.unionTypeNode("Page", KeywordTypeNode.Undefined);
        }
      }
    }

    if (this.klass.name === "SoundAPI") {
      if (this.getName() === "getCustomSounds") {
        return this.c.luaMap(KeywordTypeNode.Number, KeywordTypeNode.String);
      }
    }

    if (returnType === "Table") {
      if (this.klass.name === "AnimationAPI") {
        if (["getPlaying", "getAnimations"].includes(this.getName())) {
          return this.c.luaMap(KeywordTypeNode.String, "Animation");
        }
      }

      if (this.klass.name === "BlockState") {
        if (["getProperties", "getEntityData"].includes(this.getName())) {
          return this.c.luaMap(KeywordTypeNode.String, KeywordTypeNode.Any);
        }

        if (["getTags", "getFluidTags"].includes(this.getName())) {
          return this.c.luaMap(KeywordTypeNode.Number, KeywordTypeNode.String);
        }

        if (["getCollisionShape", "getOutlineShape"].includes(this.getName())) {
          return this.c.luaMap(KeywordTypeNode.Number, this.c.luaMap(KeywordTypeNode.Number, "Vector3"));
        }

        if (this.getName() === "getSounds") {
          return this.c.luaMap(
            KeywordTypeNode.String,
            this.c.unionTypeNode(KeywordTypeNode.String, KeywordTypeNode.Number),
          );
        }
      }

      if (this.klass.name === "Biome") {
        if (this.getName() === "getTags") {
          return this.c.luaMap(KeywordTypeNode.Number, KeywordTypeNode.String);
        }
      }

      if (this.klass.name === "WorldAPI") {
        if (this.getName() === "getBlocks") {
          return this.c.luaMap(KeywordTypeNode.Number, "BlockState");
        }

        if (this.getName() === "getPlayers") {
          return this.c.luaMap(KeywordTypeNode.String, "PlayerAPI");
        }

        if (this.getName() === "avatarVars") {
          return this.c.luaMap(KeywordTypeNode.String, this.c.luaMap(KeywordTypeNode.String, KeywordTypeNode.Any));
        }
      }
    }

    if (returnType === "Varargs") {
      if (this.klass.name === "WorldAPI") {
        if (["getBuildHeight"].includes(this.getName())) {
          return this.c.luaMultiReturn(KeywordTypeNode.Number, KeywordTypeNode.Number);
        }
      }
    }

    return returnType;
  }

  protected generateStatements() {
    const pairs = this.element.parameters.map((params, index) => {
      const returnType = this.element.returns[index];

      return [params, returnType] as const;
    });

    const names = [this.getName(), ...this.element.aliases];

    return names.flatMap((name) =>
      pairs.map(([params, returnType]) =>
        this.c.methodSignature(
          name,
          params.map((param) => this.getParameter(param, params, returnType)),
          this.getReturn(returnType, params),
        ),
      ),
    );
  }
}
