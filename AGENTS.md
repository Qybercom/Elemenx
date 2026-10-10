# Instructions for AI assistants

Elemenx is a browser UI framework shipped as one self-contained ES5 file, `elemenx.js`, plus a Node CLI (`elemenx-cli.js`, `tools/`) and the system library `libraries/ElemenxUI`.

## Read first

- `docs/CODE-STYLE.md`: the binding code style for JavaScript, HTML and CSS. Follow it exactly, including the `if` rules, empty blank lines, author-placed CSS blank lines and deliberately repeated CSS selectors.
- `docs/PUBLIC-API.md`: the public API. Do not change it unless the maintainer explicitly asks.

## Hard rules

1. **ES5 syntax only** in everything except `tests/` and the root `*.config.*` files: `var`, `function`, no ES2015+ syntax. Browser APIs (`WeakMap`, `URL`...) are fine. Tests may use modern syntax but follow the same formatting rules (`if` layout, indentation, blank lines, spacing).
2. **No Promise in the public API.** Use callbacks `(error, result)` or events.
3. **`elemenx.js` stays one self-contained file.** Do not split it into source modules and do not add runtime dependencies.
4. **The public API is frozen** by `tests/regression/public-api-surface.test.js`, the regression suite and the examples. Do not rename, remove or retype public members, `$*` names, definition keys or tested error messages.
5. **Do not commit, branch, stash or push.** The maintainer does all git history operations. Leave changes in the working tree.
6. **Every bug fix gets a regression test.** Every public API addition gets a contract test.

## Checks

```bash
npm run lint
npm test
```

`npm test` runs browser contracts (Vitest + Chrome), tooling tests (Node) and Playwright end-to-end tests. Both must pass before work is reported as done.

## Navigating `elemenx.js`

The file is about 16 000 lines. The table of contents at its top lists every section. Each section starts with a header comment: search for `/* Router` to jump to the Router, `/* Network: WebRTC` to a part of a large section.

Sections share private state only through the `Runtime` object; `docs/RUNTIME-INTERNALS.md` lists every `Runtime.*` field, its owner section and its users. Read it before touching a field, and update it in the same change when a field is added, moved or removed (`tests/regression/runtime-internals.test.js` enforces this). New sections must get a header and a line in the table of contents.

Work on one section at a time, and keep the surrounding style.
