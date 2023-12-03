import ts, {
  ExpressionWithTypeArguments,
  HeritageClause,
  Identifier,
  ModifierSyntaxKind,
  NamedTupleMember,
  Node,
  NodeFlags,
  ParameterDeclaration,
  Statement,
  SyntaxKind,
  TypeElement,
  TypeNode,
  TypeParameterDeclaration,
  factory,
  isIdentifier,
  isNamedTupleMember,
} from "typescript";
import { KeywordTypeNode } from "./sk";

export type IdentifierInput = string | Identifier;
export type TypeNodeInput = IdentifierInput | TypeNode;
export type ExpressionWithTypeArgumentsInput = IdentifierInput | ExpressionWithTypeArguments;
export type ParameterDeclarationInput = [name: IdentifierInput, type: TypeNodeInput] | ParameterDeclaration;
export type TupleMemberInput = TypeNodeInput | [name: IdentifierInput, type: TypeNodeInput] | NamedTupleMember;
export type TypeParameterDeclarationInput =
  | IdentifierInput
  | [name: IdentifierInput, constraint: TypeNodeInput]
  | [name: IdentifierInput, constraint: TypeNodeInput | undefined, defaultType: TypeNodeInput]
  | TypeParameterDeclaration;

export interface CIdentifierOptions {
  warnReserved?: boolean;
  substituteReserved?: boolean;
}

export interface CInterfaceDeclarationOptions {
  modifiers?: ModifierSyntaxKind[];
  extends?: ExpressionWithTypeArgumentsInput[];
  implements?: ExpressionWithTypeArgumentsInput[];
}

export interface CNamespaceDeclarationOptions {
  modifiers?: ModifierSyntaxKind[];
  flags?: NodeFlags;
}

export interface CVariableDeclarationOptions {
  constant?: boolean;
  modifiers?: ModifierSyntaxKind[];
}

export interface CTypeParameterDeclarationOptions {
  constraint?: TypeNodeInput;
  default?: TypeNodeInput;
}

export interface CFunctionDeclarationOptions {
  typeParameters?: TypeParameterDeclarationInput[];
  modifiers?: ModifierSyntaxKind[];
}

export class C {
  private readonly RESERVED_KEYWORDS = [
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "as",
    "implements",
    "interface",
    "let",
    "package",
    "private",
    "protected",
    "public",
    "static",
    "yield",
  ];

  constructor(private readonly validTypes: string[]) {}

  public identifier(input: IdentifierInput, options?: CIdentifierOptions): Identifier {
    const defaultOptions: CIdentifierOptions = {
      warnReserved: true,
      substituteReserved: false,
    };

    options = { ...defaultOptions, ...options };

    if (typeof input === "string") {
      if (options.substituteReserved) {
        if (input === "function") {
          input = "func";
        }
      }

      if (this.RESERVED_KEYWORDS.includes(input.toLowerCase()) && options.warnReserved) {
        console.warn(`WARNING: Identifier "${input}" is a reserved keyword`);
        console.trace();
      }

      return factory.createIdentifier(input);
    }

    return input;
  }

  private typeReferenceNode(name: IdentifierInput, typeArguments?: TypeNode[]) {
    return factory.createTypeReferenceNode(this.identifier(name, { warnReserved: false }), typeArguments);
  }

  private typeNodeFromString(type: IdentifierInput): TypeNode {
    const name = typeof type === "string" ? type : type.getText();

    if (name === "Boolean") {
      return KeywordTypeNode.Boolean;
    }

    if (name === "Integer" || name === "Number") {
      return KeywordTypeNode.Number;
    }

    if (name === "String") {
      return KeywordTypeNode.String;
    }

    if (name === "Table") {
      return this.typeReferenceNode("LuaTable");
    }

    if (name === "AnyType") {
      return KeywordTypeNode.Any;
    }

    if (name === "nil") {
      return KeywordTypeNode.Undefined;
    }

    if (!this.validTypes.includes(name)) {
      console.warn(`WARNING: Unknown type "${type}"`);
    }

    return this.typeReferenceNode(name);
  }

  public typeNodeWithArguments(type: IdentifierInput, typeArguments: TypeNodeInput[]) {
    if (typeof type === "string" && this.validTypes.includes(type)) {
      console.warn(`WARNING: Unknown type "${type}"`);
    }

    return factory.createTypeReferenceNode(
      this.identifier(type),
      typeArguments.map((t) => this.typeNode(t)),
    );
  }

  public luaMap(key: TypeNodeInput, value: TypeNodeInput) {
    return this.typeNodeWithArguments("LuaMap", [key, value]);
  }

  public luaMultiReturn(...types: (TupleMemberInput | TupleMemberInput[])[]) {
    return this.typeNodeWithArguments("LuaMultiReturn", [this.tupleTypeNode(...types)]);
  }

  public typeNode<T extends TypeNodeInput>(type: T): T extends string | Identifier ? TypeNode : T {
    if (typeof type === "string") {
      return this.typeNodeFromString(type) as T extends string | Identifier ? TypeNode : T;
    }

    return type as T extends string | Identifier ? TypeNode : T;
  }

  public unionTypeNode(...types: (TypeNodeInput | TypeNodeInput[])[]) {
    const typesArray = types.map((t) => (Array.isArray(t) ? t : [t])).flat();

    return factory.createUnionTypeNode(typesArray.map((t) => this.typeNode(t)));
  }

  public intersectionTypeNode(...types: (TypeNodeInput | TypeNodeInput[])[]) {
    const typesArray = types.map((t) => (Array.isArray(t) ? t : [t])).flat();

    return factory.createIntersectionTypeNode(typesArray.map((t) => this.typeNode(t)));
  }

  public tupleTypeNode(...types: (TupleMemberInput | TupleMemberInput[])[]) {
    const members = types.map((t) => (Array.isArray(t) ? t : [t])).flat();

    return factory.createTupleTypeNode(
      members.map((t) => {
        if (Array.isArray(t)) {
          const [name, type] = t;
          return factory.createNamedTupleMember(
            undefined,
            this.identifier(name, { substituteReserved: true }),
            undefined,
            this.typeNode(type),
          );
        }

        if (typeof t !== "string" && isNamedTupleMember(t)) {
          return t;
        }

        return this.typeNode(t);
      }),
    );
  }

  public functionTypeNode(parameters: ParameterDeclarationInput[], returnType: TypeNodeInput) {
    return factory.createFunctionTypeNode(
      undefined,
      parameters.map((p) => this.normalizeParameterDeclarationInput(p)),
      this.typeNode(returnType),
    );
  }

  public expressionWithTypeArguments(name: IdentifierInput, typeArguments: TypeNode[]) {
    return factory.createExpressionWithTypeArguments(this.identifier(name), typeArguments);
  }

  private normalizeExpressionWithTypeArgumentsInput(
    input: ExpressionWithTypeArgumentsInput,
  ): ExpressionWithTypeArguments {
    if (typeof input === "string" || isIdentifier(input)) {
      return this.expressionWithTypeArguments(input, []);
    }

    return input;
  }

  public interfaceDeclaration(name: IdentifierInput, members: TypeElement[], options?: CInterfaceDeclarationOptions) {
    const extendsClause =
      options?.extends && options.extends.length > 0
        ? factory.createHeritageClause(
            SyntaxKind.ExtendsKeyword,
            options.extends.map((e) => this.normalizeExpressionWithTypeArgumentsInput(e)),
          )
        : undefined;

    const implementsClause =
      options?.implements && options.implements.length > 0
        ? factory.createHeritageClause(
            SyntaxKind.ImplementsKeyword,
            options.implements.map((e) => this.normalizeExpressionWithTypeArgumentsInput(e)),
          )
        : undefined;

    const heritageClauses = [extendsClause, implementsClause].filter((c): c is HeritageClause => c !== undefined);

    return factory.createInterfaceDeclaration(
      options?.modifiers?.map((m) => factory.createModifier(m)),
      this.identifier(name),
      undefined,
      heritageClauses,
      members,
    );
  }

  public parameterDeclaration(name: IdentifierInput, type: TypeNodeInput) {
    return factory.createParameterDeclaration(
      undefined,
      undefined,
      this.identifier(name, { substituteReserved: true }),
      undefined,
      this.typeNode(type),
      undefined,
    );
  }

  private normalizeParameterDeclarationInput(input: ParameterDeclarationInput): ParameterDeclaration {
    if (Array.isArray(input)) {
      return this.parameterDeclaration(...input);
    }

    return input;
  }

  public indexSignature(key: ParameterDeclarationInput, type: TypeNodeInput) {
    return factory.createIndexSignature(undefined, [this.normalizeParameterDeclarationInput(key)], this.typeNode(type));
  }

  public methodSignature(name: IdentifierInput, parameters: ParameterDeclarationInput[], returnType: TypeNodeInput) {
    return factory.createMethodSignature(
      undefined,
      this.identifier(name),
      undefined,
      undefined,
      parameters.map((p) => this.normalizeParameterDeclarationInput(p)),
      this.typeNode(returnType),
    );
  }

  public propertySignature(name: IdentifierInput, type: TypeNodeInput) {
    return factory.createPropertySignature(undefined, this.identifier(name), undefined, this.typeNode(type));
  }

  public addComment<T extends Node>(text: string, statement: T): T {
    return ts.addSyntheticLeadingComment(statement, SyntaxKind.MultiLineCommentTrivia, text, true);
  }

  public moduleDeclaration(name: IdentifierInput, statements: Statement[], options?: CNamespaceDeclarationOptions) {
    return factory.createModuleDeclaration(
      options?.modifiers?.map((m) => factory.createModifier(m)),
      this.identifier(name),
      factory.createModuleBlock(statements),
      options?.flags,
    );
  }

  public variableDeclaration(name: IdentifierInput, type: TypeNodeInput, options?: CVariableDeclarationOptions) {
    return factory.createVariableStatement(
      options?.modifiers?.map((m) => factory.createModifier(m)),
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration(this.identifier(name), undefined, this.typeNode(type), undefined)],
        NodeFlags.Const,
      ),
    );
  }

  public typeParameterDeclaration(name: IdentifierInput, options?: CTypeParameterDeclarationOptions) {
    return factory.createTypeParameterDeclaration(
      undefined,
      this.identifier(name),
      options?.constraint ? this.typeNode(options.constraint) : undefined,
      options?.default ? this.typeNode(options.default) : undefined,
    );
  }

  private normalizeTypeParameterDeclarationInput(input: TypeParameterDeclarationInput): TypeParameterDeclaration {
    if (Array.isArray(input)) {
      const [name, constraint, defaultType] = input;

      return this.typeParameterDeclaration(name, {
        constraint: constraint ? this.typeNode(constraint) : undefined,
        default: defaultType ? this.typeNode(defaultType) : undefined,
      });
    }

    if (typeof input === "string" || isIdentifier(input)) {
      return this.typeParameterDeclaration(input);
    }

    return input;
  }

  public functionDeclaration(
    name: IdentifierInput,
    parameters: ParameterDeclarationInput[],
    returnType: TypeNodeInput,
    options?: CFunctionDeclarationOptions,
  ) {
    const typeParameters = options?.typeParameters?.map((p) => this.normalizeTypeParameterDeclarationInput(p));

    return factory.createFunctionDeclaration(
      options?.modifiers?.map((m) => factory.createModifier(m)),
      undefined,
      this.identifier(name),
      typeParameters,
      parameters.map((p) => this.normalizeParameterDeclarationInput(p)),
      this.typeNode(returnType),
      undefined,
    );
  }
}
