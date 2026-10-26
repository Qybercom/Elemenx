# Elemenx for VS Code

Elemenx and ElemenxUI in the editor:

- completion of the Components in the templates, their props (`Variant`, `[Variant]`), events (`(click)`), the directives (`*if`, `*for`...) and the options of a prop; the fields and functions of the Component of a template (`Name.html` beside `Name.js`) in its expressions and handlers; the Services in `$Service('...')`;
- their documentation on hover;
- go to the definition of a Component, of a Service and of a function of a template;
- diagnostics: an unknown Component, prop, event or directive;
- the colors of the syntax of the templates: `{{ }}`, `[prop]`, `(event)` and `*directive` as JavaScript.

It knows the Components of the project (its `Elemenx.Component` calls) and of the Libraries it has (`libraries/*/data/meta.json`, or the ElemenxUI of the `@qybercom/elemenx` package; else the one it carries). Settings: `elemenx.meta`, a `meta.json` of another Library; `elemenx.diagnostics`.
