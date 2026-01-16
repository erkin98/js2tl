# js2tl

Generate Telegram TL-_like_ schema lines from JSON data.

## Install

```bash
npm i -g js2tl
```

## CLI

```bash
js2tl --file data.json --type User
```

Example `data.json`:

```json
{ "id": 1, "name": "Alice", "active": true }
```

Output:

```text
user#xxxxxxxx id:int active:bool name:string = User;
```

## Library

```ts
import { inferTlSchemaFromJson, renderSchema } from "js2tl";

const schema = inferTlSchemaFromJson({ id: 1, name: "Alice" }, { rootTypeName: "User" });
console.log(renderSchema(schema));
```

## Notes

- Constructor ids are computed as CRC32 of the constructor signature (Telegram style).
- Output is conservative: mixed arrays / unions degrade to `Object` (`any`) rather than emitting unions.
