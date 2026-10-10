# Elemenx Code Style

This is the binding style for all code in the repository. Most of it is checked by `npm run lint` (ESLint: `eslint.config.mjs` with local rules in `eslint/`; stylelint: `stylelint.config.mjs` with local rules in `stylelint/`) and by the ES5 syntax test (`tests/regression/es5-syntax.test.js`). When this document and the code disagree, this document wins and the code is fixed.

Tests (`tests/`) and the root tool configs (`*.config.js`, `*.config.mjs`) are the only exception to the **Language** section: they may use modern syntax (ES modules, `async`/`await`, arrow functions, `let`/`const`...). The stylelint plugin in `stylelint/` must be an ES module, so it uses `import`/`export` and is otherwise written in ES5. Everything else in this document applies to them unchanged: `if` layout, indentation, blank lines, spacing, quotes, braces, naming.

## Language

- **ES5 syntax only.** No `let`, `const`, arrow functions, classes, template literals, destructuring, spread, default parameters, computed object keys, `for...of`, `async`/`await`, modules.
- **Runtime APIs are not restricted by ES5.** Browser and Node APIs already used by the code (`WeakMap`, `WeakSet`, `Map`, `Set`, `Symbol`, `URL`, `TextEncoder`, `fetch`, `Proxy`...) stay allowed.
- **No Promise in the public API.** Public asynchronous APIs use callbacks `(error, result)` or event subscriptions (`On(name, handler)`). A Promise may appear only internally, as a short adapter over a Promise-based browser API (`RTCPeerConnection`, `Blob.arrayBuffer`, `fetch`), and must not leak to the caller.

## File structure

- `elemenx.js` is one self-contained file by design. It must work standalone, and Web/Service Workers load the very same file through `Runtime.ScriptURL`. Do not split it and do not make it depend on other files.
- The whole file is one outer IIFE holding a private `Runtime` object. Each subsystem is an inner module:

```js
	/* Storage */
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		
		/* module-private helpers and state */
		
		Runtime.StorageFor = function () {
			/* ... */
		};
		Elemenx.Storage = Storage;
	})(typeof globalThis !== 'undefined' ? globalThis : self);
```

- Every section except `Runtime` is a strict module: `(function (global) {` or `(function () {` followed by `'use strict';` (checked by `tests/regression/runtime-internals.test.js`).
- Every section starts with a one-line `/* Name */` header and is listed in the table of contents at the top of the file. Large sections are split by `/* Section: part */` sub-headers.
- Every `Runtime.*` field is documented in `docs/RUNTIME-INTERNALS.md` under the section that assigns it.
- Modules talk to each other only through `Runtime.*`. Public members are attached to `global.Elemenx` and nothing else is global.

## Formatting

- Indentation is tabs only.
- Blank lines are completely empty in every file (JavaScript, HTML, CSS, Markdown...): no tabs, no spaces. `.editorconfig` trims trailing whitespace for this reason.
- No line ends with whitespace.
- Use single quotes, except to avoid escaping (HTML inside strings, for example).
- Semicolons are always required.
- Put a space before the parameter list: `function name (a, b) {`, `function (a, b) {`.
- Braces follow Stroustrup style: `}` and `else`/`catch`/`finally` sit on separate lines.
- `try`, `catch` and `finally` blocks are never written on one line (checked by `elemenx/try-layout`).

```js
if (bundled) {
	load();
}
else {
	discover();
}

try {
	loader();
}
catch (error) {
	loaded[type][resolved] = false;
	
	throw error;
}
```

- Object literals are written `{Path: '/', Component: 'Home'}`, with no inner padding and one space after the colon.
- Destructuring patterns and `import`/`export` lists (tests and configs only) are padded inside the braces: `function ({ page }) {`, `import { test, expect } from '@playwright/test';`.
- Declare one `var` per line, at the top of the function where practical.
- Use `===` and `!==`. The only loose comparison is `value == null` (and `!= null`) to test for both `null` and `undefined`.
- Loops are `while` with an explicit index, with `i++;` on its own line at the end of the body, separated by a blank line:

```js
var i = 0;

while (i < items.length) {
	process(items[i]);
	
	i++;
}
```

### `if` without braces

- **Early exit on the same line.** If the body is `return`, `break` or `continue` and its text is shorter than the `if (...)` header, it stays on the header line:

```js
if (loaded[type][resolved]) return true;
if (!resolved) return;
```

- **Everything else goes on the next line.** This covers an early exit that is not shorter than the header, any `throw` regardless of length, and any other statement. The body goes on the next line, indented, without braces:

```js
if (callback)
	callback(null);

if (!definition)
	throw new Error('Elemenx Service definition is required: ' + name);
```

- **if..else chains.** Either every branch has braces, or every branch stays on the line of its keyword. Do not mix the two forms in one chain.

```js
if (callback) callback(null);
else finish();
```

- Braces are always allowed. Use them whenever a branch has more than one statement.

### Blank lines

Checked by `elemenx/padding-lines` and `elemenx/one-statement-per-line`:

- `return`, `break` and `continue` are preceded by a blank line, unless they open their block.
- An `if` is preceded by a blank line, unless it opens its block.
- A `try` is preceded by a blank line, unless it opens its block.
- A statement that follows an `if`, a loop or a `try` is preceded by a blank line.
- A loop (`while`, `do`, `for`) is preceded by a blank line, unless it opens its block. When the statement right above it initializes the loop variable (`i = 0;`, `var i = 0;`), the blank line is up to the author: keep the reset next to the loop when the continuity matters.
- Consecutive one-line ifs (`if (x) return;`) form a group and may follow each other directly.
- A compact `if` (no braces) that tests a variable declared by the `var` right above it follows that `var` without a blank line. An `if` with braces is always preceded by a blank line.
- The closing increment of a `while` body (`i++;`) is preceded by a blank line.
- One statement per line: no `a(); b();`, no `{ a(); return; }`.
- **Logical groups are separated by a blank line.** Consecutive statements form one group when they are all `var` declarations, all assignments (`a = b`, `a[k] = b`, `a++`), or calls on the same object (`response.writeHead(); response.end();`) or of the same method (`outlets.set(...); values.set(...);`). Releasing a reference right after the call that used it (`clearTimeout(timer); timer = null;`, `child.$Destroy(); child = null;`) stays in the group.

```js
if (final) {
	payload = Buffer.concat(fragments);
	opcode = fragmentOpcode;
	fragmentOpcode = 0;
	fragments = [];

	message(opcode, payload);
}

if (request.method === 'HEAD') {
	headers['Content-Length'] = stat.size;

	response.writeHead(200, headers);
	response.end();
}
else if (useGzip) {
	headers['Content-Encoding'] = 'gzip';

	response.writeHead(200, headers);

	fs.createReadStream(file).pipe(zlib.createGzip()).pipe(response);
}
```

```js
var between = decl.raws.between || '';
if (between.indexOf('/*') !== -1 || valid(between)) return;

if (opcode === 8) {
	connection.Close();

	return;
}

if (opcode === 10) continue;

payload = Buffer.from(buffer.subarray(offset, offset + length));

while (i < payload.length) {
	payload[i] ^= mask[i % 4];

	i++;
}
```

Recommended but not checked:

- Put a blank line before and after multi-line blocks inside a function body.

## HTML

Applies to pages and component templates (checked by ESLint with `@html-eslint` and the local `elemenx/html-self-closing` rule):

- Indent with tabs. `<head>` and `<body>` sit at the level of `<html>`, without indentation. Their children are indented.

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<title>Elemenx</title>
</head>
<body>
	<div id="app"></div>
</body>
</html>
```

- Attribute values always use double quotes.
- Void elements are always self-closed, with a space before the slash: `<input type="text" />`, `<meta charset="utf-8" />`.
- A component without a body may be written either way: `<Card />` or `<Card></Card>`. The Advanced example shows both on purpose. A self-closed component also has a space before the slash.
- Ordinary HTML elements are never self-closed: write `<div></div>`, not `<div />`.
- Blank lines are placed by the author and are kept (empty, without indentation).
- Inline `<script>` blocks follow the JavaScript rules of this document: the code is indented one tab deeper than its `<script>` tag. Outside `tests/` they are ES5.

## CSS

Applies to `.css` files, `<style>` blocks and `style=""` attributes (checked by stylelint):

- Indent with tabs.
- Always one space after the colon of a declaration, and never a space before it: `color: #20242b;`.
- A value made of several components (`box-shadow`, `transition`, `grid-template`...) may be split by logical groups. Then the line breaks right after the colon or after a comma, and every moved group is indented one tab deeper than the declaration:

```css
.panel {
	box-shadow:
		inset 0 0 0 1px rgba(255, 255, 255, 0.12),
		0 18px 55px rgba(25, 30, 40, 0.08);
	transition: background 160ms ease,
		color 160ms ease;
}
```

- Fractional numbers always have a leading zero: `0.12`, not `.12`.
- Hex colors are lowercase and always use the full six-digit form: `#ffffff`, not `#FFF` or `#fff`.
- Blank lines are placed by the author and are mandatory. Never remove or collapse them (they only must not contain whitespace).
- Repeated selectors are the author's decision. Never merge or remove them.

## Naming

- **Public API.** Public members, definition keys and data fields are PascalCase: `Elemenx.Network.XHR`, `Routes`, `Path`, `StartMode`, `{Type: 'Transfer', ID: id}`.
- **System names.** Every `$*` name on definitions and runtime-owned instances is reserved for Elemenx (`$Template`, `$Service()`, `$OnReady`...). Ordinary names belong to application code.
- **Inside `elemenx.js`:**
  - functions that back a public member or a `Runtime.*` member are PascalCase;
  - module-private helpers are camelCase;
  - local variables are camelCase.
- **Runtime-only fields.** Internal fields placed on public objects use the `Elemenx` prefix (`ElemenxLazy`, `ElemenxServiceHandle`) or a leading underscore (`_Component`), so they never collide with application names.

## Errors and warnings

- Errors start with `Elemenx`: `throw new Error('Elemenx router outlet not found: ' + name);`.
- Error messages are part of the observable behaviour: tests match some of them. Change a message only together with its tests.
- Warnings go through `global.console.warn` after checking that the console exists.

## Comments

- Use block comments `/* ... */` to explain a contract or the reason for a non-obvious decision. Do not narrate what the code does.
- Do not commit commented-out code.

## Public API discipline

The public API is everything in `docs/PUBLIC-API.md`, frozen by `tests/regression/public-api-surface.test.js` and exercised by the regression suite and the examples. A change to it means:

1. an explicit decision by the maintainer;
2. updating `public-api-surface.test.js` and `docs/PUBLIC-API.md`;
3. a contract test for the new behaviour.

Refactoring must keep `npm test` green without touching existing assertions.
