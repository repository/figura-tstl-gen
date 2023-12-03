import { KeywordTypeSyntaxKind, SyntaxKind, factory } from "typescript";

function ktn(kind: KeywordTypeSyntaxKind) {
  return factory.createKeywordTypeNode(kind);
}

export const KeywordTypeNode = {
  Any: ktn(SyntaxKind.AnyKeyword),
  BigInt: ktn(SyntaxKind.BigIntKeyword),
  Boolean: ktn(SyntaxKind.BooleanKeyword),
  Intrinsic: ktn(SyntaxKind.IntrinsicKeyword),
  Never: ktn(SyntaxKind.NeverKeyword),
  Number: ktn(SyntaxKind.NumberKeyword),
  Object: ktn(SyntaxKind.ObjectKeyword),
  String: ktn(SyntaxKind.StringKeyword),
  Symbol: ktn(SyntaxKind.SymbolKeyword),
  Undefined: ktn(SyntaxKind.UndefinedKeyword),
  Unknown: ktn(SyntaxKind.UnknownKeyword),
  Void: ktn(SyntaxKind.VoidKeyword),
};
