import { NodeFlags, Statement, SyntaxKind, createPrinter, factory } from "typescript";
import { C } from "./c";
import { BulkClassGenerator } from "./generators/bulk-class";
import { ModuleGenerator } from "./generators/module";
import { FDocs } from "./types";

console.clear();
console.log("VVVVV");

const docs = await Bun.file("data/docs.json").json<FDocs>();

const types = docs.globals.fields.flatMap((field) => field.children.map((cls) => cls.name));
types.push("ModelPartAPI", "ModelPartIndex", "T");

const c = new C(types);
const statements: Statement[] = [
  ...new BulkClassGenerator(c, docs.globals.fields).generate(),
  ...new ModuleGenerator(c, docs.globals).generate(),
  ...new ModuleGenerator(c, docs.math).generate(),
];

const sourceFile = factory.createSourceFile(statements, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.None);
const printer = createPrinter();
const result = printer.printFile(sourceFile);

await Bun.write("out/figura.d.ts", result);
