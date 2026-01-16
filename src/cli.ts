#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { inferTlSchemaFromJson } from "./tl/infer.js";
import { renderSchema } from "./tl/render.js";
import type { InferOptions } from "./tl/infer.js";

interface Args {
  file?: string;
  rootTypeName?: string;
  rootConstructorName?: string;
  noNested?: boolean;
  noId?: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "-f" || a === "--file") {
      const v = argv[++i];
      if (v !== undefined) out.file = v;
    } else if (a === "-t" || a === "--type") {
      const v = argv[++i];
      if (v !== undefined) out.rootTypeName = v;
    } else if (a === "-c" || a === "--constructor") {
      const v = argv[++i];
      if (v !== undefined) out.rootConstructorName = v;
    } else if (a === "--no-nested") out.noNested = true;
    else if (a === "--no-id") out.noId = true;
    else if (!a.startsWith("-") && !out.file) out.file = a;
  }
  return out;
}

function usage(): string {
  return [
    "js2tl - infer TL-like schema from JSON",
    "",
    "Usage:",
    "  js2tl --file data.json [--type Root] [--constructor root] [--no-nested] [--no-id]",
    "  js2tl data.json",
    "",
    "Options:",
    "  -f, --file          Path to JSON file",
    "  -t, --type          Root type name (default: Root)",
    "  -c, --constructor   Root constructor name (default: root)",
    "  --no-nested         Do not emit nested object types",
    "  --no-id             Omit constructor ids",
    "  -h, --help          Show help",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage() + "\n");
    return;
  }
  if (!args.file) {
    process.stderr.write(usage() + "\n");
    process.exitCode = 2;
    return;
  }

  const jsonText = readFileSync(args.file, "utf8");
  const value = JSON.parse(jsonText) as unknown;

  const inferOpts: InferOptions = { emitNestedTypes: !args.noNested };
  if (args.rootTypeName !== undefined) inferOpts.rootTypeName = args.rootTypeName;
  if (args.rootConstructorName !== undefined)
    inferOpts.rootConstructorName = args.rootConstructorName;

  const schema = inferTlSchemaFromJson(value, inferOpts);
  const out = renderSchema(schema, { includeConstructorId: !args.noId });
  process.stdout.write(out + "\n");
}

main();
