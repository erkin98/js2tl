import { safeTlIdent } from "./naming.js";
import type { TlConstructor, TlField, TlSchema, TlType } from "./types.js";

export interface InferOptions {
  rootTypeName?: string;
  rootConstructorName?: string;
  /**
   * If true, infer object values as separate referenced types (Root_Field = ...).
   * If false, object fields become `any` to avoid emitting extra constructors.
   */
  emitNestedTypes?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferNumberType(n: number): TlType {
  if (!Number.isFinite(n)) return { kind: "primitive", name: "double" };
  if (Number.isInteger(n)) {
    // Telegram TL uses signed 32-bit int and 64-bit long.
    if (n >= -0x80000000 && n <= 0x7fffffff) return { kind: "primitive", name: "int" };
    return { kind: "primitive", name: "long" };
  }
  return { kind: "primitive", name: "double" };
}

function mergeTypes(a: TlType, b: TlType): TlType {
  if (a.kind === "primitive" && b.kind === "primitive" && a.name === b.name) return a;
  if (a.kind === "vector" && b.kind === "vector")
    return { kind: "vector", item: mergeTypes(a.item, b.item) };
  // Fallback union -> any (TL doesn't have unions; keep schema simple and total)
  return { kind: "primitive", name: "any" };
}

function inferArrayType(values: unknown[], ctx: InferContext): TlType {
  if (values.length === 0) return { kind: "vector", item: { kind: "primitive", name: "any" } };
  let item: TlType | null = null;
  for (const v of values) {
    const t = inferType(v, ctx);
    item = item ? mergeTypes(item, t) : t;
  }
  return { kind: "vector", item: item ?? { kind: "primitive", name: "any" } };
}

interface InferContext {
  constructors: TlConstructor[];
  emitNestedTypes: boolean;
  seenTypeNames: Set<string>;
}

function uniqueTypeName(base: string, ctx: InferContext): string {
  let name = base;
  let i = 2;
  while (ctx.seenTypeNames.has(name)) {
    name = `${base}${i}`;
    i++;
  }
  ctx.seenTypeNames.add(name);
  return name;
}

function inferObjectAsType(
  typeName: string,
  obj: Record<string, unknown>,
  ctx: InferContext
): TlType {
  if (!ctx.emitNestedTypes) return { kind: "primitive", name: "any" };
  const actualTypeName = uniqueTypeName(typeName, ctx);
  const fields: TlField[] = Object.keys(obj)
    .sort()
    .map((k) => ({
      name: safeTlIdent(k),
      type: inferType(obj[k], ctx, `${actualTypeName}_${safeTlIdent(k)}`),
    }));
  ctx.constructors.push({
    constructorName: safeTlIdent(actualTypeName.charAt(0).toLowerCase() + actualTypeName.slice(1)),
    typeName: actualTypeName,
    fields,
  });
  return { kind: "ref", name: actualTypeName };
}

function inferType(value: unknown, ctx: InferContext, nestedTypeHint?: string): TlType {
  if (value === null) return { kind: "primitive", name: "null" };
  if (typeof value === "string") return { kind: "primitive", name: "string" };
  if (typeof value === "boolean") return { kind: "primitive", name: "bool" };
  if (typeof value === "number") return inferNumberType(value);
  if (Array.isArray(value)) return inferArrayType(value, ctx);
  if (isPlainObject(value)) return inferObjectAsType(nestedTypeHint ?? "Object", value, ctx);
  return { kind: "primitive", name: "any" };
}

/**
 * Infer a TL schema from a JSON-parsed value. The common use case is passing a root object.
 *
 * Output is TL-*like* (constructor ids are Telegram-style CRC32 of the signature),
 * but type inference is intentionally conservative (no unions).
 */
export function inferTlSchemaFromJson(value: unknown, opts: InferOptions = {}): TlSchema {
  const rootTypeName = opts.rootTypeName?.trim() || "Root";
  const rootConstructorName =
    opts.rootConstructorName?.trim() || safeTlIdent(rootTypeName.toLowerCase());
  const ctx: InferContext = {
    constructors: [],
    emitNestedTypes: opts.emitNestedTypes ?? true,
    seenTypeNames: new Set<string>([rootTypeName]),
  };

  if (!isPlainObject(value)) {
    // Normalize primitives/arrays into a single-field Root type.
    const fields: TlField[] = [
      { name: "value", type: inferType(value, ctx, `${rootTypeName}_Value`) },
    ];
    ctx.constructors.unshift({
      constructorName: safeTlIdent(rootConstructorName),
      typeName: rootTypeName,
      fields,
    });
    return { constructors: ctx.constructors };
  }

  const fields: TlField[] = Object.keys(value)
    .sort()
    .map((k) => ({
      name: safeTlIdent(k),
      type: inferType(value[k], ctx, `${rootTypeName}_${safeTlIdent(k)}`),
    }));
  ctx.constructors.unshift({
    constructorName: safeTlIdent(rootConstructorName),
    typeName: rootTypeName,
    fields,
  });
  return { constructors: ctx.constructors };
}
