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

The file is about 15 600 lines. Each subsystem is an inner IIFE module. Modules share state only through the private `Runtime` object and expose public members on `global.Elemenx`. Work on one module at a time, and keep the surrounding style.
