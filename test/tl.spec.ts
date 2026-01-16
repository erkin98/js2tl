import { describe, expect, it } from "vitest";
import { constructorSignature, inferTlSchemaFromJson, renderSchema } from "../src/tl/index.js";

function typeLabel(t: { kind: string } & Record<string, unknown>): string {
  if (t.kind === "primitive") return String(t.name);
  if (t.kind === "ref") return String(t.name);
  if (t.kind === "vector") return "vector";
  return t.kind;
}

describe("inferTlSchemaFromJson", () => {
  it("infers primitives and stable output order", () => {
    const schema = inferTlSchemaFromJson({ b: "x", a: 1, c: true }, { rootTypeName: "Root" });
    expect(schema.constructors[0]?.fields.map((f) => `${f.name}:${typeLabel(f.type)}`)).toEqual([
      "a:int",
      "b:string",
      "c:bool",
    ]);
  });

  it("renders a TL-like line and signature ends with semicolon", () => {
    const schema = inferTlSchemaFromJson({ id: 1, name: "Alice" }, { rootTypeName: "User" });
    const sig = constructorSignature(schema.constructors[0]!);
    expect(sig.endsWith(";")).toBe(true);
    const rendered = renderSchema(schema);
    expect(rendered).toContain("= User;");
    expect(rendered).toMatch(/#([0-9a-f]{8})/);
  });

  it("emits nested constructors for nested objects", () => {
    const schema = inferTlSchemaFromJson(
      { msg: { text: "hi", count: 2 } },
      { rootTypeName: "Root", emitNestedTypes: true }
    );
    expect(schema.constructors.length).toBeGreaterThan(1);
    expect(renderSchema(schema)).toContain("= Root;");
  });
});
