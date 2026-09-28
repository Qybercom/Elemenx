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

## Elemenx CLI

`elemenx-cli.js` is the public toolchain entry point. When installed as a package it is exposed as `elemenx`.

```text
elemenx build [project]
elemenx dev [project] [--port 4173]
elemenx serve [project] [--port 4175]
elemenx help
elemenx version
```

The command registry is intentionally extensible for future command groups such as `generate component`, `generate service`, `generate guard`, `generate directive`, `inspect`, and other project operations.

An optional `elemenx.config.js` may export `Application`, `Entry`, `Index`, `Output`, and `Server` settings. CLI options override configuration, and configuration overrides Elemenx defaults.

Production `serve` enables gzip for compressible responses of at least 1024 bytes and sends `ETag`, `Last-Modified`, `Vary: Accept-Encoding`, and conditional `304` responses. Development serving does not compress by default.

## Generators

The CLI can create the four application entity types and register them in the same `index.js` graph consumed by Discovery and Builder.

```text
elemenx generate component UserCard
elemenx generate service Session
elemenx generate guard Authorized
elemenx generate directive Tooltip
```

`elemenx g ...` is an alias for `generate`. Components are created in `application/components/<Name>/` with a JavaScript definition and HTML template. Services, guards, and directives are created in their corresponding application directories. Missing type directories and `index.js` files are created automatically and the root `application/index.js` is updated when necessary.

Existing generated files are never overwritten unless `--force` is supplied. Re-running registration does not duplicate graph entries.

## Graph-aware generation

Entity destinations are relative to the configured application root and are not forced into type-specific directories.

```text
elemenx g component TestComponent
elemenx g component ./foo/bar/nested/TestComponent
elemenx g service ./auth/Session
```

The generator resolves the destination first and then walks upward from that destination looking for the nearest existing `index.js`. That index becomes the graph owner. The generated entity is registered with a path relative to that index. If no nested owner exists, registration falls back to the application root `index.js`.

Components use `<Name>/<Name>.js` plus `<Name>/<Name>.html`. Services, guards and directives use `<Name>.js` at their requested destination. Generated paths may not escape the configured application root.

Graph-aware generation is regression-tested for nearest-owner precedence, ancestor fallback, root registration, dot paths, Windows separators, duplicate graph entries, custom application roots, path escape rejection, overwrite protection, and real CLI invocation.

## Named Applications

Create an Application graph in the current directory:

```
elemenx generate application FooApp
```

Or choose the project/host directory explicitly:

```
elemenx generate application FooApp ./path
```

The Application graph root is named after the Application (`FooApp/index.js`). Host files such as `index.html`, `app.js`, `elemenx.config.js`, and `package.json` are created only when missing, so another Application can be added beside an existing one without overwriting the host:

```
elemenx generate application BarApp
```

Entities can address a named graph from the project root:

```
elemenx generate component BarApp/Pages/Home
```