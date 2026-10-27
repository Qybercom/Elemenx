# Code style for front-end projects

This document is the binding code style of a project that adopts it. It is written for AI agents first and for people second: every rule is stated so that it can be applied without guessing, and most of them are checked by the linters whose full configuration is at the end of this document. Copy this file into a project as `CODE-STYLE.md`, create the files of the appendix, and point the instructions of the project (`AGENTS.md`, `CLAUDE.md`) to it.

When this document and the code disagree, the code is wrong and is fixed. When this document and the instructions of a project disagree, the project wins: it may set the switches below, or add rules of its own.

## For AI agents: how to work with this document

1. **Read it all before writing code.** The rules are short; a rule you did not read is a rule you will break in every file.
2. **Apply it to everything you write or change:** JavaScript, HTML, CSS, tests, configuration, and the blank lines of every file, Markdown included.
3. **Run the linters after every change:** `npm run lint`. Run `npx eslint --fix` and `npx stylelint --fix "**/*.{css,html}"` first, then fix by hand what they cannot. A change is not done while the lint reports anything.
4. **Never weaken the checks.** Do not add `eslint-disable` comments, do not change the configuration, do not rename a file to escape a rule. If a rule seems wrong for a case, say so to the person and leave the decision to them.
5. **Keep the author's decisions.** Blank lines in CSS and HTML, repeated CSS selectors, the order of declarations and the grouping of statements are the author's. Do not "tidy" code you were not asked to change.
6. **Match the code around you.** Its comments, names and idioms are the model; this document wins only where they disagree with it.
7. **Before you report the work as done:** lint is clean, tests pass, and every rule of the checklist at the end holds for the lines you wrote.

## Project switches

A project sets these in its instructions (`AGENTS.md`: "Code style: CODE-STYLE.md; language: es5; asynchronous API: callbacks"). Without a setting, the default applies.

| Switch | Values | Default | What changes |
| --- | --- | --- | --- |
| Language | `modern`, `es5` | `modern` | the syntax allowed in shipped code (see **Language**); the formatting rules are the same |
| Asynchronous API | `callbacks`, `promises` | `callbacks` | how public functions that take time answer (see **Asynchronous code**) |

Tests and tool configuration files may always use modern syntax, whatever the switch.

## Setup

The checks need these packages (the versions the rules were written and tested with):

```json
{
	"scripts": {
		"lint": "eslint && stylelint \"**/*.{css,html}\"",
		"lint:fix": "eslint --fix && stylelint --fix \"**/*.{css,html}\""
	},
	"devDependencies": {
		"@html-eslint/eslint-plugin": "0.66.1",
		"@html-eslint/parser": "0.66.1",
		"@stylistic/eslint-plugin": "5.10.0",
		"@stylistic/stylelint-plugin": "5.3.1",
		"eslint": "10.12.0",
		"eslint-plugin-html": "8.2.1",
		"postcss-html": "2.0.0",
		"stylelint": "17.16.0"
	}
}
```

And these files, whose full text is in the appendix:

| File | What it is |
| --- | --- |
| `.editorconfig` | tabs, UTF-8, no trailing whitespace, for every editor |
| `eslint.config.mjs` | the JavaScript and HTML rules; the switch Language is its first lines |
| `eslint/plugin.cjs` and `eslint/rules/*.cjs` | the rules of this style no published plugin has: the layout of `if` and `try`, the blank lines, one statement per line, self-closing tags |
| `stylelint.config.mjs` | the CSS rules, for `.css` files, `<style>` blocks and `style=""` attributes |
| `stylelint/plugin.mjs` | the colon of a CSS declaration |

Adjust the `ignores` of both configurations to the folders of the project (its build output, vendored code).

## Language

### `modern` (the default)

Any syntax the target browsers run: `const` and `let`, arrow functions, classes, template literals, destructuring, spread, modules, `async`/`await`. Two rules keep it close to the rest of this style:

- One declaration per statement and per line: `const a = 1;` then `const b = 2;`, never `const a = 1, b = 2;`. `const` by default, `let` only for a binding that is reassigned, `var` never.
- Arrow functions for short callbacks (`items.map((item) => item.ID)`); a named method or a function used as a constructor is a `function`.

### `es5`

For code that must run as it is, without a build, in any browser or worker: no `let`, `const`, arrow functions, classes, template literals, destructuring, spread, default parameters, computed object keys, `for...of`, `async`/`await` or modules. Declare with `var`, one per line, at the top of the function where practical.

APIs of the runtime are not syntax and stay allowed when the targets have them: `Map`, `Set`, `WeakMap`, `Symbol`, `Proxy`, `URL`, `fetch`, `TextEncoder`.

## Asynchronous code

### `callbacks` (the default)

- A public function that takes time takes a callback as its last argument and calls it `(error, result)`: `error` is `null` on success, an `Error` otherwise.
- The callback is called exactly once, and never before the function has returned (call it in a task or a microtask if the answer is ready at once): the caller's code after the call always runs first.
- A source of many results (a connection, a stream, a model that changes) is an object with `On(name, callback)` and `Off(name, callback)`, or `OnChange(callback)` and `OffChange(callback)`.
- A Promise may be used inside, as a short adapter over a browser API that returns one (`fetch`, `navigator.clipboard`), and never leaks to the caller.

### `promises`

Public functions that take time return a Promise and are written with `async`/`await`. A rejected Promise carries an `Error`. Sources of many results still use `On`/`Off`.

## Formatting

The examples are written in ES5, so they hold under both switches; in `modern` code read `var` as `const`, or `let` for a binding that is reassigned.

### Whitespace

- **Indentation is tabs**, everywhere: JavaScript, HTML, CSS, JSON, Markdown code blocks.
- **Blank lines are completely empty**: no tab, no space. No line ends with whitespace.
- Files are UTF-8 and end with one line break.

### JavaScript

- Single quotes, except to avoid escaping: `'It\'s'` is written `"It's"`.
- Semicolons always.
- A space before the parameter list of every function: `function name (a, b) {`, `function (a, b) {`, `async function (page) {`.
- A space around `=>`: `(item) => item.ID`.
- Braces in the Stroustrup style: `}` stands alone, and `else`, `catch` and `finally` start the next line.

```js
if (bundled) {
	load();
}
else {
	discover();
}

try {
	value = JSON.parse(text);
}
catch (error) {
	value = null;
}
```

- `try`, `catch` and `finally` blocks are never written on one line.
- Object literals have no padding inside their braces and one space after each colon: `{Path: '/', Component: 'Home'}`. Arrays likewise: `[1, 2, 3]`.
- Destructuring patterns and `import`/`export` lists are padded inside their braces: `function ({ page }) {`, `import { test, expect } from '@playwright/test';`.
- No space inside parentheses: `call(a, b)`, `if (ready)`.
- One space after a keyword and around binary operators: `if (a === b)`, `return value;`, `a + b`.
- `===` and `!==` always. The only loose comparison is `value == null` (and `!= null`), which tests `null` and `undefined` together.
- One statement per line: never `a(); b();`, never `{ a(); return; }`.
- Loops are `while` with an explicit index, or the methods of arrays (`forEach`, `map`, `filter`, `some`); `for...of` in `modern` code. The increment of a `while` is the last statement of its body, alone, after a blank line:

```js
var i = 0;

while (i < items.length) {
	render(items[i]);

	i++;
}
```

### `if` without braces

A branch that is one statement may go without braces, under these rules:

- **A short early exit stays on the line of its `if`.** When the body is `return`, `break` or `continue` and its text is shorter than the `if (...)` header:

```js
if (!item) return;
if (done) break;
```

- **Everything else goes on the next line, indented.** An early exit that is not shorter than the header, any `throw`, any other statement:

```js
if (callback)
	callback(null, result);

if (!name)
	throw new Error('Store: a name is required');
```

- **An `if...else` chain** braces every branch, or keeps every branch on the line of its keyword. Never both in one chain:

```js
if (error) callback(error);
else callback(null, value);
```

- Braces are always allowed, and required for more than one statement.

### Blank lines

Blank lines show the structure of a function: what belongs together, and where the flow turns.

1. `return`, `break` and `continue` are preceded by a blank line, unless they open their block.
2. An `if` is preceded by a blank line, unless it opens its block. One-line `if`s (`if (x) return;`) may follow each other directly as a group.
3. A compact `if` (no braces) that tests a variable declared right above it follows that declaration directly, without a blank line.
4. A loop (`while`, `do`, `for`) is preceded by a blank line, unless it opens its block. When the statement above it sets the variable the loop uses (`i = 0;`), the blank line is the author's choice.
5. A `try` is preceded by a blank line, unless it opens its block.
6. A statement that follows an `if`, a loop or a `try` is preceded by a blank line.
7. **Logical groups are separated by a blank line.** Consecutive statements are one group when they are all declarations, all assignments (`a = b`, `a[k] = b`, `a++`), or calls on the same object (`response.writeHead(); response.end();`) or of the same method (`outlets.set(...); values.set(...);`). Releasing a reference right after the call that used it stays in the group (`clearTimeout(timer); timer = null;`).

```js
var between = declaration.raws.between || '';
if (valid(between)) return;

if (opcode === 8) {
	connection.Close();

	return;
}

payload = Buffer.from(buffer.subarray(offset, offset + length));
mask = header.Mask;

while (i < payload.length) {
	payload[i] ^= mask[i % 4];

	i++;
}

response.writeHead(200, headers);
response.end(payload);
```

Recommended, not checked: a blank line before and after a block of several lines inside a function.

## HTML

For pages and the templates of components:

- Tabs. `<head>` and `<body>` stay at the level of `<html>`; their children are indented.

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />

	<title>Orders</title>
</head>
<body>
	<main id="app"></main>
</body>
</html>
```

- Attribute values in double quotes.
- Void elements are always self-closed, with a space before the slash: `<input type="text" />`, `<img src="a.png" alt="" />`, `<br />`.
- Ordinary elements are never self-closed: `<div></div>`, not `<div />`.
- A component of a framework (a tag that starts with a capital letter) may be written either way: `<Card />` or `<Card></Card>`.
- No attribute twice on one element.
- Blank lines are the author's, and kept (empty).
- An inline `<script>` follows the JavaScript rules, its code indented one tab deeper than the tag.
- Semantic elements first: `<button>` for an action, `<a href>` for a place, `<label>` for a field, `<main>`, `<nav>`, `<header>` for the parts of a page. A `<div>` with a click handler is a bug.

## CSS

For `.css` files, `<style>` blocks and `style=""` attributes:

- Tabs.
- One space after the colon of a declaration, none before it: `color: #20242b;`.
- A value of several parts may be split by its logical groups: the line breaks right after the colon or after a comma, and every moved group is indented one tab deeper than the declaration.

```css
.panel {
	box-shadow:
		inset 0 0 0 1px rgba(255, 255, 255, 0.12),
		0 18px 55px rgba(25, 30, 40, 0.08);
	transition: background 160ms ease,
		color 160ms ease;
}
```

- A fraction has its leading zero: `0.12`, not `.12`.
- Hex colors are lower case and six digits: `#ffffff`, not `#FFF` or `#fff`.
- Blank lines are the author's, and never removed or collapsed.
- Repeated selectors are the author's decision: never merge or remove them.
- Colors, radii and spacings of components come from custom properties (`var(--brand)`), defined once for the light and the dark scheme; a component does not write a color of its own.
- Class names are kebab-case with the prefix of their project or library (`acme-price`, `acme-price-old`): styles of different libraries meet on one page.
- Logical properties (`margin-inline`, `padding-block`, `inset-inline-start`) where a layout must also work right to left.

## Naming

- **Public members, keys of definitions and fields of data objects: PascalCase.** `Store.Get(key)`, `{ID: 7, Title: 'Report', CreatedAt: '2026-10-27'}`, `Routes`, `Path`. A data object of the program is read the same way from the code and from the JSON of the server.
- **Module-private helpers and local variables: camelCase.** `function parseIndex (source) {`, `var startedAt = Date.now();`.
- **Constants of a module: PascalCase.** `var Void = {area: true, ...};`, `const Limit = 50;`.
- **Events: PascalCase or lower case, one convention for the project.** A namespace with a dot when there are families (`Transport.Open`, `Protocol.Message`).
- **Internal fields on public objects** take a prefix of the project (`AcmeCache`) or an underscore (`_Owner`), so they never collide with the names of the application.
- **CSS classes**: kebab-case, prefixed (see **CSS**).
- **Files**: a component's files take its name (`CartLine/CartLine.js`, `.html`, `.css`); other files are named by what they hold, in the case of the thing (`services/Cart.js`, `tools/builder.js`).
- Names say what a thing is, in full words: `Items`, not `arr`; `Remove(id)`, not `rm(i)`. A boolean reads as a statement: `Visible`, `Loading`, `HasMore`.

## Comments

- Every file starts with a block comment that says what it is and its contract: what it takes, what it gives, what it promises. A reader learns the file there without reading its code.
- Inside the code, block comments `/* ... */` explain a contract or the reason for a decision that is not obvious. They never narrate what the next line does.
- Full sentences, in English, in the present tense.
- No commented-out code: version control keeps the old.
- No TODO without a ticket or a name.

## Errors and logs

- An error message starts with the name of the project or library and says what was expected: `throw new Error('Acme Store expects a name: ' + name);`. Tests may match it: changing a message is changing behavior.
- An exception in a callback of the user is reported (`console.error`, or `reportError`) and does not stop the other callbacks.
- Write to the console only after checking that it exists (`if (global.console && console.warn)`), in code that may run in a worker or a test.
- Production code logs nothing on success.

## Tests

- Tests follow this style, with modern syntax allowed.
- Every bug fixed gets a test that fails without the fix. Every public function added gets a test of its contract.
- An end-to-end test finds elements as a person does: by role and name (`getByRole('button', {name: 'Save'})`), by label (`getByLabel('Email')`), by text. A test that needs a CSS class to find a button has found an accessibility bug.
- A test does not wait by time (`waitForTimeout(500)`) when it can wait for a state (`await expect(locator).toHaveText(...)`).
- A test cleans what it made: files, servers, timers, the storage of the page.

## Checklist

Before reporting a change as done, for every line written:

- [ ] `npm run lint` reports nothing; no rule was disabled.
- [ ] Tabs; blank lines empty; no trailing whitespace.
- [ ] The language switch holds (no modern syntax in `es5` code).
- [ ] `if` layout and blank lines as above.
- [ ] One statement per line; one declaration per line.
- [ ] Names: PascalCase public and data, camelCase private and local.
- [ ] A comment at the head of every new file; no narrating comments, no dead code.
- [ ] Errors start with the name of the project.
- [ ] A test for every bug fixed and every public function added; tests pass.
- [ ] The author's blank lines, repeated selectors and order kept in what was not asked to change.

## Appendix: the files of the checks

Create each file with the text below, exactly.

### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
indent_style = tab
indent_size = 4
end_of_line = lf
insert_final_newline = true
# Blank lines carry no whitespace.
trim_trailing_whitespace = true
```

### `eslint.config.mjs`

```js
import stylistic from '@stylistic/eslint-plugin';
import html from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';
import inlineScripts from 'eslint-plugin-html';
import house from './eslint/plugin.cjs';

/*
 * The mechanical form of CODE-STYLE.md.
 * Language: 'latest' for the switch modern, 5 for the switch es5.
 * Source: 'module' for code with import/export, 'script' for classic scripts (es5 code is 'script').
 */
var Language = 'latest';
var Source = 'module';

/* The folders the checks skip: the output of builds, reports, vendored code. */
var Ignored = ['node_modules/**', 'dist/**', '**/dist/**', 'build/**', 'coverage/**', 'test-results/**', 'playwright-report/**', 'vendor/**'];

var formatting = {
	'house/if-layout': 'error',
	'house/one-statement-per-line': 'error',
	'house/padding-lines': 'error',
	'house/try-layout': 'error',
	'eqeqeq': ['error', 'always', {null: 'ignore'}],
	'one-var': ['error', 'never'],
	'@stylistic/indent': ['error', 'tab', {SwitchCase: 1}],
	'@stylistic/no-mixed-spaces-and-tabs': 'error',
	'@stylistic/no-trailing-spaces': 'error',
	'@stylistic/brace-style': ['error', 'stroustrup', {allowSingleLine: true}],
	'@stylistic/quotes': ['error', 'single', {avoidEscape: true}],
	'@stylistic/semi': ['error', 'always'],
	'@stylistic/space-before-function-paren': ['error', 'always'],
	'@stylistic/space-before-blocks': ['error', 'always'],
	'@stylistic/keyword-spacing': ['error', {before: true, after: true}],
	'@stylistic/space-infix-ops': 'error',
	'@stylistic/comma-spacing': ['error', {before: false, after: true}],
	'@stylistic/key-spacing': ['error', {beforeColon: false, afterColon: true}],
	'@stylistic/object-curly-spacing': ['error', 'never', {overrides: {ObjectPattern: 'always', ImportDeclaration: 'always', ExportNamedDeclaration: 'always', ImportAttributes: 'always'}}],
	'@stylistic/array-bracket-spacing': ['error', 'never'],
	'@stylistic/space-in-parens': ['error', 'never'],
	'@stylistic/arrow-spacing': ['error', {before: true, after: true}]
};

var plugins = {
	'@stylistic': stylistic,
	house: house
};

export default [
	{
		ignores: Ignored
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'error'
		}
	},
	{
		/* The code of the project: the switch Language applies (the tools and the tests below keep their own). */
		files: ['**/*.js', '**/*.mjs'],
		ignores: ['*.config.js', '*.config.mjs', 'stylelint/**', 'tests/**', '**/*.test.js', '**/*.spec.js'],
		languageOptions: {
			ecmaVersion: Language,
			sourceType: Source
		},
		plugins: plugins,
		rules: Object.assign({}, formatting, {
			'no-unused-vars': ['error', {vars: 'all', args: 'none', caughtErrors: 'none'}],
			'no-var': Language === 5 ? 'off' : 'error',
			'prefer-const': Language === 5 ? 'off' : 'error'
		})
	},
	{
		/* The rules of the style themselves: CommonJS, written in ES5. */
		files: ['eslint/**/*.cjs'],
		languageOptions: {
			ecmaVersion: 5,
			sourceType: 'commonjs'
		},
		plugins: plugins,
		rules: formatting
	},
	{
		/* Tests and the configuration of the tools: modern syntax, whatever the switch. */
		files: ['tests/**/*.js', 'tests/**/*.mjs', '**/*.test.js', '**/*.spec.js', '*.config.js', '*.config.mjs', 'stylelint/**/*.mjs'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		plugins: plugins,
		rules: formatting
	},
	{
		/* Inline <script> blocks of HTML: the same JavaScript rules, the code one tab inside <script>. */
		files: ['**/*.html'],
		plugins: Object.assign({html: inlineScripts}, plugins),
		settings: {
			'html/indent': '+tab',
			'html/report-bad-indent': 'error'
		},
		languageOptions: {
			ecmaVersion: Language,
			sourceType: 'script'
		},
		rules: formatting
	},
	{
		/* Pages and templates. <head> and <body> stay at the level of <html>. */
		files: ['**/*.html'],
		languageOptions: {
			parser: htmlParser
		},
		plugins: {
			'@html-eslint': html
		},
		rules: {
			'house/html-self-closing': 'error',
			'@html-eslint/indent': ['error', 'tab', {tagChildrenIndent: {html: 0}}],
			'@html-eslint/quotes': ['error', 'double'],
			'@html-eslint/no-extra-spacing-attrs': ['error', {enforceBeforeSelfClose: true, disallowMissing: true}],
			'@html-eslint/no-duplicate-attrs': 'error',
			'@html-eslint/no-trailing-spaces': 'error'
		}
	}
];
```

### `eslint/plugin.cjs`

```js
'use strict';

module.exports = {
	meta: {
		name: 'eslint-plugin-house'
	},
	rules: {
		'if-layout': require('./rules/if-layout.cjs'),
		'html-self-closing': require('./rules/html-self-closing.cjs'),
		'one-statement-per-line': require('./rules/one-statement-per-line.cjs'),
		'padding-lines': require('./rules/padding-lines.cjs'),
		'try-layout': require('./rules/try-layout.cjs')
	}
};
```

### `eslint/rules/if-layout.cjs`

```js
'use strict';

/*
 * Layout of `if` statements whose branches are not blocks.
 *
 * A single `if` (no else):
 * - early exit (return, break, continue) shorter than its `if (...)` header stays on the header line;
 * - everything else, including throw, goes to the next line.
 *
 * An if..else chain either braces every branch or keeps every branch on the line of its keyword.
 */

var EarlyExit = {
	ReturnStatement: true,
	BreakStatement: true,
	ContinueStatement: true
};

function collapse (text) {
	return text.replace(/\s+/g, ' ');
}

function isChainHead (node) {
	return !(node.parent && node.parent.type === 'IfStatement' && node.parent.alternate === node);
}

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Enforce the house layout of non-block if branches'
		},
		messages: {
			sameLine: 'Short early exit must stay on the `if` line.',
			nextLine: 'This `if` body must start on the next line.',
			chainSameLine: 'Non-block if..else branches must stay on the line of their keyword.',
			chainMixed: 'An if..else chain must either brace every branch or brace none.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function hasComments (left, right) {
			return sourceCode.commentsExistBetween(left, right);
		}

		function lineIndent (line) {
			return /^[ \t]*/.exec(sourceCode.lines[line - 1])[0];
		}

		function moveToLine (fixer, keyword, body) {
			if (hasComments(keyword, body)) return null;

			return fixer.replaceTextRange([keyword.range[1], body.range[0]], ' ');
		}

		function moveToNextLine (fixer, keyword, body, header) {
			if (hasComments(keyword, body)) return null;

			return fixer.replaceTextRange([keyword.range[1], body.range[0]], '\n' + lineIndent(header.loc.start.line) + '\t');
		}

		function checkSingle (node) {
			var close = sourceCode.getTokenBefore(node.consequent);
			var header = collapse(sourceCode.text.slice(node.range[0], close.range[1]));
			var body = collapse(sourceCode.getText(node.consequent));
			var sameLine = node.consequent.loc.start.line === close.loc.end.line;

			if (EarlyExit[node.consequent.type] && body.length < header.length) {
				if (!sameLine) {
					context.report({
						node: node.consequent,
						messageId: 'sameLine',
						fix: function (fixer) {
							return moveToLine(fixer, close, node.consequent);
						}
					});
				}

				return;
			}

			if (sameLine) {
				context.report({
					node: node.consequent,
					messageId: 'nextLine',
					fix: function (fixer) {
						return moveToNextLine(fixer, close, node.consequent, node);
					}
				});
			}
		}

		function checkChain (node) {
			var branches = [];
			var current = node;
			var blocks = 0;
			var i = 0;

			while (current) {
				branches.push({Keyword: sourceCode.getTokenBefore(current.consequent), Body: current.consequent});

				if (current.alternate && current.alternate.type === 'IfStatement') {
					current = current.alternate;

					continue;
				}

				if (current.alternate)
					branches.push({Keyword: sourceCode.getTokenBefore(current.alternate), Body: current.alternate});

				current = null;
			}

			while (i < branches.length) {
				if (branches[i].Body.type === 'BlockStatement')
					blocks++;

				i++;
			}

			if (blocks === branches.length) return;

			if (blocks) {
				context.report({node: node, messageId: 'chainMixed'});

				return;
			}

			i = 0;

			while (i < branches.length) {
				(function (branch) {
					if (branch.Body.loc.start.line === branch.Keyword.loc.end.line) return;

					context.report({
						node: branch.Body,
						messageId: 'chainSameLine',
						fix: function (fixer) {
							return moveToLine(fixer, branch.Keyword, branch.Body);
						}
					});
				})(branches[i]);

				i++;
			}
		}

		return {
			IfStatement: function (node) {
				if (!isChainHead(node)) return;

				if (node.alternate) {
					checkChain(node);

					return;
				}

				if (node.consequent.type !== 'BlockStatement')
					checkSingle(node);
			}
		};
	}
};
```

### `eslint/rules/padding-lines.cjs`

```js
'use strict';

/*
 * Blank lines between statements of one block (CODE-STYLE.md, "Blank lines"):
 *
 * 1. return, break and continue are preceded by a blank line, unless they open their block.
 * 2. An `if` is preceded by a blank line, unless it opens its block. Exceptions:
 *    - consecutive one-line ifs (`if (x) return;`) form a group and may follow each other directly;
 *    - rule 4.
 * 3. A statement that follows an `if`, a loop or a `try` (and is not itself checked by rules 1, 2, 6, 8) is preceded by a blank line.
 * 4. A compact `if` (no braces) that tests a variable declared by the `var` right above it
 *    follows that `var` without a blank line.
 * 5. The closing increment of a `while` body (`i++;`, `i += step;`) is preceded by a blank line.
 * 6. A loop (while, do, for) is preceded by a blank line, unless it opens its block or the statement
 *    right above it initializes a variable the loop uses (`i = 0;` or `var i = 0;`): then the blank line is optional.
 * 7. Logical groups are separated by a blank line. Consecutive simple statements belong to one group when they are
 *    all `var` declarations, all assignments (`a = b`, `a[k] = b`, `a++`), or calls on the same root
 *    (`response.writeHead(); response.end();`) or of the same method (`outlets.set(...); values.set(...);`).
 *    Releasing a reference right after the call that used it (`clearTimeout(timer); timer = null;`,
 *    `child.destroy(); child = null;`) stays in the group.
 * 8. A `try` is preceded by a blank line, unless it opens its block.
 */

var Exit = {
	ReturnStatement: true,
	BreakStatement: true,
	ContinueStatement: true
};

var Loop = {
	WhileStatement: true,
	DoWhileStatement: true,
	ForStatement: true,
	ForInStatement: true,
	ForOfStatement: true
};

function isIf (node) {
	return node.type === 'IfStatement';
}

function isCompactIf (node) {
	return isIf(node) && !node.alternate && node.consequent.type !== 'BlockStatement';
}

function isOneLineIf (node) {
	return isCompactIf(node) && node.loc.start.line === node.loc.end.line;
}

function isIncrement (node) {
	var expression = node.type === 'ExpressionStatement' ? node.expression : null;
	if (!expression) return false;

	if (expression.type === 'UpdateExpression')
		return expression.argument.type === 'Identifier';

	return expression.type === 'AssignmentExpression' && (expression.operator === '+=' || expression.operator === '-=') && expression.left.type === 'Identifier';
}

function root (node) {
	while (node) {
		if (node.type === 'Identifier') return node.name;

		if (node.type === 'ThisExpression') return 'this';

		if (node.type === 'MemberExpression') node = node.object;
		else if (node.type === 'CallExpression' || node.type === 'NewExpression') node = node.callee;
		else if (node.type === 'ChainExpression') node = node.expression;
		else return null;
	}

	return null;
}

function method (node) {
	if (node.type === 'ChainExpression')
		node = node.expression;

	if ((node.type === 'CallExpression' || node.type === 'NewExpression') && node.callee.type === 'MemberExpression' && !node.callee.computed) return node.callee.property.name;

	return null;
}

function unwrap (node) {
	var expression = node.expression;
	if (expression.type === 'AwaitExpression' || (expression.type === 'UnaryExpression' && expression.operator === 'void'))
		expression = expression.argument;

	return expression;
}

function group (node) {
	var expression;

	if (node.type === 'VariableDeclaration') return {Kind: 'var'};

	if (node.type !== 'ExpressionStatement') return null;

	expression = unwrap(node);

	if (expression.type === 'AssignmentExpression' || expression.type === 'UpdateExpression') return {Kind: 'assign', Expression: expression};

	if (expression.type === 'CallExpression' || expression.type === 'NewExpression' || expression.type === 'ChainExpression') {
		if (!root(expression)) return null;

		return {Kind: 'call', Root: root(expression), Method: method(expression), Expression: expression};
	}

	return null;
}

function isRelease (call, assign) {
	var target = assign.Expression;
	var expression = call.Expression.type === 'ChainExpression' ? call.Expression.expression : call.Expression;
	var args = expression.arguments;
	var i = 0;

	if (target.type !== 'AssignmentExpression' || target.operator !== '=' || target.right.type !== 'Literal' || target.right.value !== null) return false;

	if (expression.callee.type === 'MemberExpression' && sameTarget(expression.callee.object, target.left)) return true;

	while (args && i < args.length) {
		if (sameTarget(args[i], target.left)) return true;

		i++;
	}

	return false;
}

function sameTarget (a, b) {
	if (a.type !== b.type) return false;

	if (a.type === 'Identifier') return a.name === b.name;

	if (a.type === 'ThisExpression') return true;

	if (a.type === 'MemberExpression')
		return !a.computed && !b.computed && a.property.name === b.property.name && sameTarget(a.object, b.object);

	return false;
}

function sameGroup (a, b) {
	if (a.Kind !== b.Kind)
		return a.Kind === 'call' && b.Kind === 'assign' && isRelease(a, b);

	if (a.Kind !== 'call') return true;

	return a.Root === b.Root || (a.Method !== null && a.Method === b.Method);
}

function declaredNames (node) {
	var result = [];
	var i = 0;

	if (node.type === 'VariableDeclaration') {
		while (i < node.declarations.length) {
			if (node.declarations[i].id.type === 'Identifier')
				result.push(node.declarations[i].id.name);

			i++;
		}
	}
	else if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' && node.expression.left.type === 'Identifier') {
		result.push(node.expression.left.name);
	}

	return result;
}

function references (node, names) {
	var found = false;

	function walk (current) {
		var key;

		if (found || !current || typeof current.type !== 'string') return;

		if (current.type === 'Identifier' && names.indexOf(current.name) !== -1) {
			found = true;

			return;
		}

		for (key in current) {
			if (key === 'parent' || key === 'loc' || key === 'range' || !current[key] || typeof current[key] !== 'object') continue;

			if (Array.isArray(current[key])) current[key].forEach(walk);
			else walk(current[key]);
		}
	}

	if (!names.length) return false;

	walk(node);

	return found;
}

function loopHead (node) {
	return {type: 'LoopHead', parts: [node.init, node.test, node.update, node.left, node.right]};
}

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Enforce the house blank lines between statements'
		},
		messages: {
			beforeExit: 'Expected a blank line before this statement.',
			beforeIf: 'Expected a blank line before this `if`.',
			beforeLoop: 'Expected a blank line before this loop.',
			beforeTry: 'Expected a blank line before this `try`.',
			afterBlock: 'Expected a blank line after the `if`, loop or `try` above.',
			varIf: 'This `if` tests the variable declared right above it: no blank line between them.',
			beforeIncrement: 'Expected a blank line before the closing increment of the loop.',
			group: 'Expected a blank line between different logical groups (declarations, assignments, calls on another object).'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function lineEnd (line) {
			return sourceCode.getIndexFromLoc({line: line, column: 0}) + sourceCode.lines[line - 1].length;
		}

		function hasBlankLine (previous, current) {
			var line = previous.loc.end.line + 1;

			while (line < current.loc.start.line) {
				if (/^\s*$/.test(sourceCode.lines[line - 1])) return true;

				line++;
			}

			return false;
		}

		function requireBlank (previous, current, messageId) {
			if (hasBlankLine(previous, current)) return;

			context.report({
				node: current,
				messageId: messageId,
				fix: function (fixer) {
					return fixer.insertTextAfterRange([0, lineEnd(previous.loc.end.line)], '\n');
				}
			});
		}

		function forbidBlank (previous, current) {
			if (!hasBlankLine(previous, current)) return;

			context.report({
				node: current,
				messageId: 'varIf',
				fix: function (fixer) {
					if (sourceCode.commentsExistBetween(previous, current)) return null;

					return fixer.replaceTextRange([lineEnd(previous.loc.end.line), sourceCode.getIndexFromLoc({line: current.loc.start.line, column: 0})], '\n');
				}
			});
		}

		function pair (previous, current, last, loop) {
			var previousGroup;
			var currentGroup;

			if (isIf(current)) {
				if (previous.type === 'VariableDeclaration' && isCompactIf(current) && references(current.test, declaredNames(previous))) forbidBlank(previous, current);
				else if (!(isOneLineIf(previous) && isOneLineIf(current))) requireBlank(previous, current, 'beforeIf');

				return;
			}

			if (loop && last && isIncrement(current)) {
				requireBlank(previous, current, 'beforeIncrement');

				return;
			}

			if (Exit[current.type]) {
				requireBlank(previous, current, 'beforeExit');

				return;
			}

			if (Loop[current.type]) {
				if (!references(loopHead(current), declaredNames(previous)))
					requireBlank(previous, current, 'beforeLoop');

				return;
			}

			if (current.type === 'TryStatement') {
				requireBlank(previous, current, 'beforeTry');

				return;
			}

			if (isIf(previous) || Loop[previous.type] || previous.type === 'TryStatement') {
				requireBlank(previous, current, 'afterBlock');

				return;
			}

			previousGroup = group(previous);
			currentGroup = group(current);

			if (previousGroup && currentGroup && !sameGroup(previousGroup, currentGroup))
				requireBlank(previous, current, 'group');
		}

		function check (statements, loop) {
			var i = 1;

			while (i < statements.length) {
				if (statements[i - 1].loc.end.line !== statements[i].loc.start.line)
					pair(statements[i - 1], statements[i], i === statements.length - 1, loop);

				i++;
			}
		}

		return {
			Program: function (node) {
				check(node.body);
			},
			BlockStatement: function (node) {
				check(node.body, node.parent && (node.parent.type === 'WhileStatement' || node.parent.type === 'DoWhileStatement') && node.parent.body === node);
			},
			SwitchCase: function (node) {
				check(node.consequent);
			}
		};
	}
};
```

### `eslint/rules/one-statement-per-line.cjs`

```js
'use strict';

/*
 * One statement per line: `a(); b();` and `{ a(); return; }` are split.
 * The body of an `if` on the header line is governed by house/if-layout and is not counted here.
 */

function lineIndent (sourceCode, line) {
	return /^[ \t]*/.exec(sourceCode.lines[line - 1])[0];
}

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Allow only one statement per line'
		},
		messages: {
			split: 'Only one statement per line.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function check (statements) {
			var i = 1;

			while (i < statements.length) {
				(function (previous, current) {
					if (previous.loc.end.line !== current.loc.start.line) return;

					context.report({
						node: current,
						messageId: 'split',
						fix: function (fixer) {
							if (sourceCode.commentsExistBetween(previous, current)) return null;

							return fixer.replaceTextRange([previous.range[1], current.range[0]], '\n' + lineIndent(sourceCode, previous.loc.start.line));
						}
					});
				})(statements[i - 1], statements[i]);

				i++;
			}
		}

		return {
			Program: function (node) {
				check(node.body);
			},
			BlockStatement: function (node) {
				check(node.body);
			},
			SwitchCase: function (node) {
				check(node.consequent);
			}
		};
	}
};
```

### `eslint/rules/try-layout.cjs`

```js
'use strict';

/*
 * try, catch and finally blocks are never written on one line:
 *
 * try {
 * 	value = JSON.parse(source);
 * }
 * catch (error) {
 * 	return null;
 * }
 *
 * `catch` and `finally` on their own line after `}` are enforced by @stylistic/brace-style (stroustrup).
 */

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: {
			description: 'Require multi-line try, catch and finally blocks'
		},
		messages: {
			multiline: 'A `{{name}}` block must not be written on one line.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		function lineIndent (line) {
			return /^[ \t]*/.exec(sourceCode.lines[line - 1])[0];
		}

		function check (block, name) {
			var open;
			var close;
			var first;
			var last;
			var indent;

			if (!block || block.loc.start.line !== block.loc.end.line) return;

			open = sourceCode.getFirstToken(block);
			close = sourceCode.getLastToken(block);
			first = sourceCode.getTokenAfter(open, {includeComments: true});
			last = sourceCode.getTokenBefore(close, {includeComments: true});
			indent = lineIndent(block.loc.start.line);

			context.report({
				node: block,
				messageId: 'multiline',
				data: {name: name},
				fix: function (fixer) {
					if (first === close)
						return fixer.replaceTextRange([open.range[1], close.range[0]], '\n' + indent);

					return [
						fixer.replaceTextRange([open.range[1], first.range[0]], '\n' + indent + '\t'),
						fixer.replaceTextRange([last.range[1], close.range[0]], '\n' + indent)
					];
				}
			});
		}

		return {
			TryStatement: function (node) {
				check(node.block, 'try');

				if (node.handler)
					check(node.handler.body, 'catch');

				check(node.finalizer, 'finally');
			}
		};
	}
};
```

### `eslint/rules/html-self-closing.cjs`

```js
'use strict';

/*
 * Self-closing tags in HTML templates.
 *
 * - Void elements are always written self-closed with a space: <input type="text" />.
 * - Components (PascalCase) may be written either way: <Card /> or <Card></Card>.
 * - Other HTML elements are never self-closed: <div /> is not valid HTML.
 */

var Void = {
	area: true,
	base: true,
	br: true,
	col: true,
	embed: true,
	hr: true,
	img: true,
	input: true,
	link: true,
	meta: true,
	source: true,
	track: true,
	wbr: true
};

module.exports = {
	meta: {
		type: 'layout',
		fixable: 'code',
		docs: {
			description: 'Enforce the house self-closing tags in HTML templates'
		},
		messages: {
			voidClose: 'Void element <{{name}}> must be written self-closed: " />".',
			elementClose: 'HTML element <{{name}}> cannot be self-closed.'
		},
		schema: []
	},
	create: function (context) {
		var sourceCode = context.sourceCode;

		return {
			Tag: function (node) {
				var name;
				var end;
				var before;

				if (!node.openStart || !node.openEnd) return;

				name = node.openStart.value.replace(/^</, '');
				end = node.openEnd;

				if (/^[A-Z]/.test(name)) return;

				if (Void[name.toLowerCase()]) {
					if (end.value === '/>') return;

					before = sourceCode.text.charAt(end.range[0] - 1);

					context.report({
						loc: end.loc,
						messageId: 'voidClose',
						data: {name: name},
						fix: function (fixer) {
							return fixer.replaceTextRange(end.range, /\s/.test(before) ? '/>' : ' />');
						}
					});

					return;
				}

				if (end.value === '/>') {
					context.report({
						loc: end.loc,
						messageId: 'elementClose',
						data: {name: name}
					});
				}
			}
		};
	}
};
```

### `stylelint.config.mjs`

```js
/*
 * The CSS of CODE-STYLE.md: CSS files, <style> blocks and style="" attributes of HTML.
 * The author's blank lines and repeated selectors are deliberate and never checked; blank lines carry no whitespace.
 */
export default {
	plugins: ['@stylistic/stylelint-plugin', './stylelint/plugin.mjs'],
	ignoreFiles: ['node_modules/**', 'dist/**', '**/dist/**', 'build/**', 'coverage/**', 'test-results/**', 'playwright-report/**', 'vendor/**'],
	overrides: [
		{
			files: ['**/*.html'],
			customSyntax: 'postcss-html'
		}
	],
	rules: {
		'house/declaration-colon': true,
		'@stylistic/indentation': 'tab',
		'@stylistic/no-eol-whitespace': true,
		'@stylistic/number-leading-zero': 'always',
		'@stylistic/color-hex-case': 'lower',
		'color-hex-length': 'long'
	}
};
```

### `stylelint/plugin.mjs`

```js
import stylelint from 'stylelint';

/*
 * house/declaration-colon: no space before the colon of a declaration; after it exactly one space,
 * or a line break when a multi-component value (box-shadow, transition, grid-template...) is split by logical groups.
 * The indentation of the moved groups (one level deeper than the declaration) is checked by @stylistic/indentation.
 *
 * Written in ES5 style; only the module syntax is required by stylelint.
 */

var ruleName = 'house/declaration-colon';

var messages = stylelint.utils.ruleMessages(ruleName, {
	rejected: 'Expected ": " or a line break after the colon, and no space before it'
});

function valid (between) {
	return /^:( |\r?\n[ \t]*)$/.test(between);
}

function rule (primary) {
	return function (root, result) {
		var validOptions = stylelint.utils.validateOptions(result, ruleName, {actual: primary, possible: [true]});
		if (!validOptions) return;

		root.walkDecls(function (decl) {
			var between = decl.raws.between || '';
			if (between.indexOf('/*') !== -1 || valid(between)) return;

			stylelint.utils.report({
				ruleName: ruleName,
				result: result,
				node: decl,
				message: messages.rejected,
				word: decl.prop + between,
				fix: function () {
					decl.raws.between = /\n/.test(between) ? ':' + between.slice(between.search(/\r?\n/)) : ': ';
				}
			});
		});
	};
}

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = {
	url: 'CODE-STYLE.md',
	fixable: true
};

export default stylelint.createPlugin(ruleName, rule);
```
