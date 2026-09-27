# Elemenx Builder

The production builder turns an Elemenx application directory into a self-contained `dist` directory.

## Default project layout

```text
Application/
├── application/
├── app.js
├── index.html
└── dist/
    ├── index.html
    ├── app.js
    └── elemenx.js
```

`dist/app.js` contains the generated Bundle Registry followed by the original application bootstrap from `app.js`. Component `TemplateURL` and `StyleURL` resources are inlined into the bundle.

`dist/index.html` is copied from the normal development `index.html`; a separate production HTML file is not required. `elemenx.js` is copied into `dist`, so the result can be served independently of the source tree.

Other public files and directories in the project root are copied to `dist`. The application source directory, `node_modules`, package metadata, `dist`, and the legacy `index.production.html` are excluded.

## Build

```text
node tools/builder.js build examples/Advanced
```

Defaults are `application/`, `app.js`, `index.html`, and `dist/`. They can be overridden with `--application`, `--entry`, `--index`, and `--out`.

## Serve production

```text
node tools/builder.js serve examples/Advanced/dist --port 4175
```

## Serve development

```text
node tools/builder.js dev examples/Advanced --port 4173
```

Development and production can therefore run simultaneously on separate ports.

For the Advanced example:

```text
npm run build:advanced
npm run example:advanced
npm run example:advanced:dist
```