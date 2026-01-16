import { crc32, toHex8 } from "./crc32.js";
import type { TlConstructor, TlField, TlSchema, TlType } from "./types.js";

export interface RenderOptions {
  includeConstructorId?: boolean;
}

export function renderTlType(t: TlType): string {
  if (t.kind === "primitive") {
    // Telegram-ish style (Vector<T>).
    if (t.name === "any") return "Object";
    if (t.name === "null") return "Null";
    return t.name;
  }
  if (t.kind === "ref") return t.name;
  return `Vector<${renderTlType(t.item)}>`;
}

export function renderField(f: TlField): string {
  return `${f.name}:${renderTlType(f.type)}`;
}

export function constructorSignature(c: TlConstructor): string {
  const fields = c.fields.map(renderField).join(" ");
  return `${c.constructorName}${fields ? " " + fields : ""} = ${c.typeName};`;
}

export function constructorIdHex(c: TlConstructor): string {
  const sig = constructorSignature(c);
  return toHex8(crc32(sig));
}

export function renderConstructor(c: TlConstructor, opts: RenderOptions = {}): string {
  const fields = c.fields.map(renderField).join(" ");
  const maybeId = (opts.includeConstructorId ?? true) ? `#${constructorIdHex(c)} ` : "";
  const rhs = `${c.typeName};`;
  return `${c.constructorName}${maybeId}${fields ? fields + " " : ""}= ${rhs}`;
}

export function renderSchema(schema: TlSchema, opts: RenderOptions = {}): string {
  return schema.constructors.map((c) => renderConstructor(c, opts)).join("\n");
}
