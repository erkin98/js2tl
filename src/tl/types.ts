export type TlPrimitive = "int" | "long" | "double" | "string" | "bool" | "bytes" | "null" | "any";

export type TlType =
  | { kind: "primitive"; name: TlPrimitive }
  | { kind: "vector"; item: TlType }
  | { kind: "ref"; name: string };

export interface TlField {
  name: string;
  type: TlType;
}

export interface TlConstructor {
  constructorName: string;
  typeName: string;
  fields: TlField[];
}

export interface TlSchema {
  /**
   * Constructors represent lines like:
   * `user#12345678 id:int name:string = User;`
   */
  constructors: TlConstructor[];
}
