#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { inferTlSchemaFromJson } from "./tl/infer.js";
import { renderSchema } from "./tl/render.js";

interface Args {
  file?: string;
  type?: string;
  constructor?: string;
  noNested?: boolean;
  noId?: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "-f" || a === "--file") out.file = argv[++i];
    else if (a === "-t" || a === "--type") out.type = argv[++i];
    else if (a === "-c" || a === "--constructor") out.constructor = argv[++i];
    else if (a === "--no-nested") out.noNested = true;
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

  const schema = inferTlSchemaFromJson(value, {
    rootTypeName: args.type,
    rootConstructorName: args.constructor,
    emitNestedTypes: !args.noNested,
  });
  const out = renderSchema(schema, { includeConstructorId: !args.noId });
  process.stdout.write(out + "\n");
}

main();
