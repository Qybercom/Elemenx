# Elemenx in the editors

`editors/` holds what the editors know of Elemenx. They all share one core, `editors/core/elemenx-language.js`, which is ES5 and has no dependency.

## What they do

- **Completion.** It completes:
  - in the templates (`.html`): the Components; their props (`Variant`), bindings (`[Variant]`), events (`(click)`) and the options of a prop (`Variant="ghost"`); the directives (`*if`, `*for`, `*tip`...); `[attribute.]`, `[class.]` and `[style.]`;
  - in the expressions and handlers of a template: the fields and functions of its own Component, the one defined beside it with its name (`Board.html` next to `Board.js`);
  - in the code (`.js`): the Services in `$Service('...')` and `Elemenx.Service('...')`.
- **Hover.** It shows the documentation of a Component, a prop, a directive, a Service or a field.
- **Go to definition.** It goes to the definition of a Component, a Service, or a function of a template.
- **Colors.** The Components (a tag with a capital), the bindings `[prop]`, the events `(event)`, the directives `*directive` and `{{ }}` take colors of their own; their expressions are JavaScript, and so is the HTML of a `$Template: '...'` in the code. In IntelliJ and WebStorm: Settings → Editor → Color Scheme → Elemenx changes the colors; the JavaScript of the expressions needs the JavaScript of the IDE (WebStorm, IntelliJ IDEA Ultimate, PhpStorm). In VS Code: the scopes of the components (`support.class.component`), bindings (`variable.other.property`), events (`entity.name.function`) and directives (`keyword.control`) take the colors of the theme.
- **Diagnostics.** It marks an unknown Component and an unknown directive (warning), and a prop or an event a Component does not have (information). It leaves alone what any element takes: `class`, `id`, `slot`, `data-*`, `aria-*`...

The knowledge has three sources:

- the `meta.json` of the Libraries (`elemenx meta`) the project has: `libraries/*/data/meta.json`, or the ElemenxUI of the `@qybercom/elemenx` package; the extension carries a copy for a project with neither;
- the `Elemenx.Component`, `Elemenx.Service` and `Elemenx.Directive` calls of the project (`node_modules`, `dist` and `build` are skipped);
- the core directives.

## The packages

- `editors/vscode`: the extension of VS Code. It takes the core in its own host, so no language server runs. It adds the colors of the syntax of the templates: `{{ }}`, `[prop]`, `(event)` and `*directive`, their values as JavaScript. Settings:
  - `elemenx.meta`: the `meta.json` of another Library;
  - `elemenx.diagnostics`.
- `editors/server`: the language server, LSP over stdio (`node editors/server/elemenx-language-server.js --stdio`, `--meta <file>`), for any editor that speaks LSP: Neovim, Zed, Sublime, Helix...
- `editors/intellij`: the plugin of the IDEs of JetBrains (IntelliJ IDEA, WebStorm, PhpStorm...). It is written in Kotlin and runs the language server through [LSP4IJ](https://plugins.jetbrains.com/plugin/23257-lsp4ij), which it depends on. It needs Node.js: `ELEMENX_NODE` names a Node other than the `node` of `PATH`. The inspections of HTML of the IDE are kept quiet on the Components (a tag with a capital) and the bindings (`[prop]`, `(event)`, `*directive`) of a template: the language server marks the ones that are truly unknown. Its tests run in a light IDE of IntelliJ IDEA Community, which Gradle downloads: `gradlew test -PideaCommunity=2025.2.6.3` in `editors/intellij`.

## Building

```bash
npm run editors
```

This makes `dist/editors/elemenx-vscode.vsix` with `@vscode/vsce`, through `npx`. Install it with Extensions → ⋯ → Install from VSIX.

```bash
node editors/build.js --intellij --idea "C:/Program Files/JetBrains/IntelliJ IDEA"
```

This also makes `dist/editors/elemenx-intellij-1.0.0.zip` with Gradle (the wrapper of `editors/intellij`; `JAVA_HOME` a JDK of 21 or more, the JBR of an IDE will do). `--idea` builds against an IDE of the machine; without it, Gradle downloads IntelliJ IDEA. Install it with Settings → Plugins → ⚙ → Install Plugin from Disk; LSP4IJ comes from the Marketplace.

`tests/regression/language-server.test.js` checks the core and the server over stdio.
