# Elemenx in the editors

`editors/` holds what the editors know of Elemenx. They all share one core, `editors/core/elemenx-language.js`, which is ES5 and has no dependency.

## What they do

- **Completion.** It completes:
  - in the templates (`.html`): the Components; their props (`Variant`), bindings (`[Variant]`), events (`(click)`) and the options of a prop (`Variant="ghost"`); the directives (`*if`, `*for`, `*tip`...); `[attribute.]`, `[class.]` and `[style.]`;
  - in the expressions and handlers of a template: the fields and functions of its own Component, the one defined beside it with its name (`Board.html` next to `Board.js`);
  - in the code (`.js`): the Services in `$Service('...')` and `Elemenx.Service('...')`.
- **References.** An element of a template named `#Name` is the one of `this.$Ref('Name')` in the code of its Component: `$Ref('` completes the names of the template, a name of `$Ref` goes to its element and `#Name` to its first `$Ref`, and a `this.$Ref('Name')` with no `#Name` in the template is marked (warning). The template of a Component is its `$TemplateURL`, or the `.html` of its name beside it.
- **Hover.** It shows the documentation of a Component, a prop, a directive, a Service, a field or a reference.
- **Go to definition.** It goes to the definition of a Component, a Service, a function of a template, a directive (the core ones, `*if`, `*for`..., to their `Register` in `elemenx.js`), a prop (its key in the definition) and an event (the `$Emit` that tells it).
- **Colors.** The Components (a tag with a capital), the bindings `[prop]`, the events `(event)`, the directives `*directive`, the references `#name` and `{{ }}` take colors of their own (in IntelliJ and WebStorm chosen for the light and the dark schemes, each with a contrast of 4.5:1 or more); their expressions are JavaScript, and so is the HTML of a `$Template: '...'` in the code. In IntelliJ and WebStorm: Settings → Editor → Color Scheme → Elemenx changes the colors; the JavaScript of the expressions needs the JavaScript of the IDE (WebStorm, IntelliJ IDEA Ultimate, PhpStorm). In VS Code: the scopes of the components (`support.class.component`), bindings (`variable.other.property`), events (`entity.name.function`) and directives (`keyword.control`) take the colors of the theme.
- **Diagnostics.** It marks an unknown Component and an unknown directive (warning), and a prop or an event a Component does not have (information). It leaves alone what any element takes: `class`, `id`, `slot`, `data-*`, `aria-*`...

A project that has only builds of `dist` (`elemenx.all.min.js`, `elemenx-ui.js`) has none of the sources: the extensions carry the ones of their version (`elemenx.js` and the `.js` and `.html` of ElemenxUI), and the definitions go there. The builds themselves are never read: a minified file, or one with the banner of a build (`/*! Elemenx 0.10.1`), holds copies, not definitions.

The knowledge has three sources:

- the `meta.json` of the Libraries (`elemenx meta`) the project has: `libraries/*/data/meta.json`, or the ElemenxUI of the `@qybercom/elemenx` package; the extension carries a copy for a project with neither;
- the `Elemenx.Component`, `Elemenx.Service` and `Elemenx.Directive` calls of the project (`node_modules`, `dist` and `build` are skipped);
- the core directives.

## The packages

- `editors/vscode`: the extension of VS Code. It takes the core in its own host, so no language server runs. It adds the colors of the syntax of the templates: `{{ }}`, `[prop]`, `(event)` and `*directive`, their values as JavaScript. Settings:
  - `elemenx.meta`: the `meta.json` of another Library;
  - `elemenx.diagnostics`.
- `editors/server`: the language server, LSP over stdio (`node editors/server/elemenx-language-server.js --stdio`, `--meta <file>`), for any editor that speaks LSP: Neovim, Zed, Sublime, Helix...
- `editors/intellij`: the plugin of the IDEs of JetBrains (IntelliJ IDEA, WebStorm, PhpStorm...). It is written in Kotlin and runs the language server through [LSP4IJ](https://plugins.jetbrains.com/plugin/23257-lsp4ij), which it depends on. It needs Node.js: `ELEMENX_NODE` names a Node other than the `node` of `PATH`. A Component (a tag with a capital) is an element of its own for the IDE, not the tag of HTML of its name: `<Input>`, `<Select>` or `<Image>` take none of the rules of `input`, `select` or `img`. The inspections of HTML are kept quiet on the bindings (`[prop]`, `(event)`, `*directive`) and the references (`#name`) of a template: the language server marks the ones that are truly unknown. The JavaScript of an expression (`{{Title}}`, `[value]="Name"`) sees the names of its template, as Elemenx does: the fields and functions of its Component (the keys of its definition, and what its code sets: `this.X = ...`, `state.X = ...` of `$Batch`), the variables of the loops around it, `$T` and `$index`; `Title` is the field of the Component, not a `Title` of some library of the project. The Component of a template is the file of code of its name beside it, or, for a `<template id="x">` of a page, the definition with `$TemplateID: 'x'`. Their types come from the values of the definition: `Title: ''` a string, `Items: []` an array, `Rows: [{ID: 1}]` an array of `{ID: number}`, `CallState: {Muted: false}` an object whose keys complete (`CallState.`), are checked and go to their place (Ctrl+click on `Muted`); the item of `*for="row of Rows"` has the type of the items. A JSDoc above a key gives it a type of its own, where the value tells too little:

```js
Elemenx.Component('Team', {
	/** @type {{Name: string, Online: boolean}[]} */
	People: [],
	/** @type {?{ID: number, Label: string}} */
	Selected: null
});
```

A field set only from code (`state.People = Load()`) has its name but no type. Its tests run in a light IDE that Gradle downloads, of IntelliJ IDEA Community (`gradlew test -PideaCommunity=2025.2.6.3` in `editors/intellij`) and of WebStorm for the JavaScript of the expressions (`gradlew test -Pwebstorm=2026.2.3`).

The extensions have the version of Elemenx: `npm run version:set` puts it in `editors/vscode/package.json` and `editors/intellij/build.gradle.kts` too.

## Building

```bash
npm run editors
```

This makes `dist/editors/elemenx-vscode.vsix` with `@vscode/vsce`, through `npx`. Install it with Extensions → ⋯ → Install from VSIX.

```bash
node editors/build.js --intellij --idea "C:/Program Files/JetBrains/IntelliJ IDEA"
```

This also makes `dist/editors/elemenx-intellij.zip` with Gradle (the wrapper of `editors/intellij`; `JAVA_HOME` a JDK of 21 or more, the JBR of an IDE will do). `--idea` builds against an IDE of the machine; without it, Gradle downloads IntelliJ IDEA. Install it with Settings → Plugins → ⚙ → Install Plugin from Disk; LSP4IJ comes from the Marketplace.

`tests/regression/language-server.test.js` checks the core and the server over stdio.

## The marketplaces

A release of Elemenx (`publish.yml`, its job **GitHub release with the editors**) publishes the extensions to the VS Code Marketplace, to Open VSX (VSCodium, Cursor, Windsurf...) and to the JetBrains Marketplace, each when its secrets are set in the repository (Settings → Secrets and variables → Actions); a marketplace without them is skipped. A prerelease version (`0.11.0-beta.1`) goes as a pre-release (VS Code, Open VSX) or to the channel `beta` (JetBrains). A version that is there already is skipped, so **Re-run failed jobs** goes on from the marketplace that failed. Once, for each of them:

**VS Code Marketplace**

1. Sign in to <https://marketplace.visualstudio.com/manage> with a Microsoft account and create the publisher `qybercom` (the `publisher` of `editors/vscode/package.json`).
2. In Azure DevOps (<https://dev.azure.com>, an organization of the same account), User settings → Personal access tokens → New token: Organization **All accessible organizations**, Scopes **Custom defined** → **Marketplace: Manage**.
3. The token is the secret `VSCE_PAT`.

**Open VSX**

1. Sign in to <https://open-vsx.org> with GitHub, link an Eclipse account in the settings of the profile and sign the Publisher Agreement there.
2. Settings → Access Tokens → Generate New Token; it is the secret `OVSX_PAT`.
3. Create the namespace once: `npx ovsx create-namespace qybercom -p <the token>`.

**JetBrains Marketplace**

1. Sign in to <https://plugins.jetbrains.com> with a JetBrains account and create the vendor (an organization) **Qybercom**.
2. Upload the first version by hand: Upload plugin, with `elemenx-intellij.zip` of a GitHub release (or of `dist/editors`). JetBrains checks a new plugin before it shows (a few days); the next versions go from the workflow.
3. My Tokens (<https://plugins.jetbrains.com/author/me/tokens>) → Generate Token; it is the secret `JETBRAINS_TOKEN`.
4. The certificate that signs the plugin (the Marketplace takes only signed plugins), made once with OpenSSL:

   ```bash
   openssl genpkey -aes-256-cbc -algorithm RSA -out private_encrypted.pem -pkeyopt rsa_keygen_bits:4096
   ```

   ```bash
   openssl rsa -in private_encrypted.pem -out private.pem
   ```

   ```bash
   openssl req -key private.pem -new -x509 -days 3650 -out chain.crt
   ```

   The secrets: `JETBRAINS_CERTIFICATE_CHAIN` the text of `chain.crt`, `JETBRAINS_PRIVATE_KEY` the text of `private.pem`, `JETBRAINS_PRIVATE_KEY_PASSWORD` the password given to the first command. Keep the files out of the repository.
