# Editors and IDEs

Elemenx has extensions for VS Code, the IDEs of JetBrains (WebStorm, IntelliJ IDEA, PhpStorm...) and Visual Studio 2022, and a language server for the other editors. They know the Components, props, events, directives and Services of your project and of ElemenxUI.

## Installing

| Editor | Where |
| --- | --- |
| VS Code, VSCodium, Cursor, Windsurf | the Marketplace of the editor (VS Code Marketplace or Open VSX): **Elemenx** |
| WebStorm, IntelliJ IDEA, PhpStorm... | Settings → Plugins → Marketplace: **Elemenx**; it installs LSP4IJ, which it needs |
| Visual Studio 2022 (17.10 or later) | Extensions → Manage Extensions: **Elemenx** |
| Neovim, Zed, Sublime Text, Helix... | the language server of the repository: `node editors/server/elemenx-language-server.js --stdio` |

Every release of Elemenx attaches the files of the extensions to its GitHub release as well (`elemenx-vscode.vsix`, `elemenx-intellij.zip`, `elemenx-visualstudio.vsix`), for an installation from disk. The extensions have the version of Elemenx. The plugin of JetBrains, the extension of Visual Studio and the language server need Node.js; `ELEMENX_NODE` names a Node other than the one of `PATH`.

## What they do

- **Completion**: Components and their props, bindings (`[Variant]`), events (`(click)`) and the options of a prop (`Variant="ghost"`); directives (`*if`, `*for`, `*tip`...); the fields and functions of the Component in the expressions of its template; Services in `$Service('...')`; references in `$Ref('...')` and `$Refs('...')`.
- **Hover**: the documentation of a Component, a prop, a directive, a Service, a field or a reference.
- **Go to definition** (Ctrl+click): a Component, a Service, a field or a function of the template, a directive (the core ones too), a prop (its key in the definition), an event (the `$Emit` that sends it), a reference (`#Name` and `$Ref('Name')` lead to each other), `$T` (its definition in `elemenx.js`) and the key of `$T('ui.call.leave')` (its phrase in the nearest `locales/*.json`, English first; its hover shows the phrase in each language).
- **Diagnostics**: an unknown Component or directive, a prop or an event a Component does not have, a `$Ref` with no element of that name in the template.
- **Colors**: Components, bindings, events, directives, references and `{{ }}` take colors of their own, and their expressions are colored as JavaScript.

A project that has only the built files (`dist/elemenx.all.min.js`) still gets all of it: the extensions carry the sources of their version of Elemenx and ElemenxUI.

## The template and its Component

The template of a Component is its `$TemplateURL`, the `.html` of its name beside it (`Board.html` next to `Board.js`), or a `<template id="x">` of a page for a definition with `$TemplateID: 'x'`. A name in `$Template` (`'#x'`) is marked as an error. The expressions of the template see what Elemenx gives them: the fields and functions of the Component, the variables of the loops around them, `$T` and `$index`.

In WebStorm and IntelliJ IDEA the expressions are JavaScript of the IDE, with the types of the fields taken from their values: `Title: ''` is a string, `Rows: [{ID: 1}]` an array of `{ID: number}`, so `Rows[0].` completes `ID`, and the item of `*for="row of Rows"` has the type of the items. A JSDoc above a key gives it a type where the value tells too little:

```js
Elemenx.Component('Team', {
	/** @type {{Name: string, Online: boolean}[]} */
	People: [],
	/** @type {?{ID: number, Label: string}} */
	Selected: null
});
```

## Other editors

The language server speaks LSP over stdio. In Neovim, for example:

```lua
vim.lsp.start({
	name = 'elemenx',
	cmd = {'node', '/path/to/elemenx/editors/server/elemenx-language-server.js', '--stdio'},
	root_dir = vim.fs.root(0, {'package.json', 'elemenx.config.js'})
})
```

`--meta <file>` gives it the `meta.json` of another Library.
