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

`dist/app.js` contains the generated Bundle Registry followed by the original application bootstrap from `app.js`. Component `$TemplateURL` and `$StyleURL` resources are inlined into the bundle.

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
elemenx build [project] [--single]
elemenx dev [project] [--host 127.0.0.1] [--port 4173]
elemenx serve [project] [--host 127.0.0.1] [--port 4175]
              [--compression true|false]
              [--compression-threshold 1024]
              [--cache-control "public, max-age=0, must-revalidate"]
elemenx icons <directory> <output.svg> [--current-color]
elemenx help
elemenx version
```

The command registry is intentionally extensible for future command groups such as `generate component`, `generate service`, `generate guard`, `generate directive`, `inspect`, and other project operations.

`elemenx icons` builds an icon set for the `Icons` Service of ElemenxUI from a directory of SVG files (Lucide, Tabler, Phosphor, exported designs...): one `<symbol>` per file, named after the file (`Arrow Left.svg` becomes `arrow-left`), with the `viewBox` of the file (or its `width` and `height`) and the `fill` and `stroke` attributes of its root, so a filled or a colored icon keeps its paint. The ids inside an icon (gradients, masks) get the name of the icon before them, so the icons do not collide in one page. `--current-color` turns every color but `none` into `currentColor`, so the icons take the color of the text.

An optional `elemenx.config.js` may export `Application`, `Entry`, `Index`, `Output`, and `Server` settings. CLI options override configuration, and configuration overrides Elemenx defaults.

Production `serve` enables gzip for compressible responses of at least 1024 bytes and sends `ETag`, `Last-Modified`, `Cache-Control`, `Vary: Accept-Encoding`, and conditional `304` responses. `HEAD` returns the same representation headers and `Content-Length` without a response body. Development serving does not compress by default. Server values follow the same precedence as the rest of the CLI: explicit CLI option, then `elemenx.config.js`, then Elemenx defaults.

## A single file

`elemenx build [project] --single` (or `Single: true` in `elemenx.config.js`) builds the whole Application into one `index.html`: the framework, the code of the Application, its templates and styles, and the Libraries it uses (their stylesheets, and their sprites and data through `Elemenx.Resource`), inline and minified. Images and the other public files of the project are copied next to it. `index.html` must load `elemenx.js` and the entry (`app.js`) with `<script src>`: they take the places of those scripts. The framework stays a script of its own (`<script id="elemenx">`), so a `WebWorker` loads it from a `blob:` copy of its text.

The page runs from any static server and from a file (`file://`), with these limits: a browser runs no worker from a file (open the page from a server to use workers); a `ServiceWorker` needs a script file of its own; the Router uses the History API, which a page opened from a file cannot change, so an Application with routes runs from a server; a Content Security Policy must allow inline scripts and styles, and `blob:` workers.

## Distribution of the framework

`npm run dist` (`tools/dist.js`) builds the distribution of Elemenx into `dist/` (`npm test` builds it too, before it runs the browser contracts against the minified framework and the end-to-end tests):

| File | Content |
|---|---|
| `elemenx.js`, `elemenx.min.js` | the framework |
| `elemenx-ui.js`, `elemenx-ui.min.js` | ElemenxUI standalone: every component with its template and style, the stylesheets, the sprites and the data, embedded |
| `elemenx.all.js`, `elemenx.all.min.js` | both in one file |
| `elemenx-ui/` | ElemenxUI as files, for the Discovery of a project (`Elemenx.Library('ElemenxUI', {$Root: ...})`) |
| `manifest.json` | the version, and the size, the gzip size and the integrity (SRI) of every file |

The minifier (`tools/minify.js`) has no dependencies and renames nothing, so no public name can break: it drops comments (but `/*!` licenses) and the blanks that carry no meaning, and keeps a line break where a statement could end. Templates and stylesheets are minified the same way.

The standalone files need no build and no server, `file://` included: ElemenxUI registers itself, injects its styles and carries its files through `Elemenx.Resource`.

```html
<script src="elemenx.all.min.js"></script>
<script>
	Elemenx.Component('Root', {$Template: '<Button Label="Save" Icon="save" Variant="primary" />'});
	Elemenx.Application('App', {$Use: ['ElemenxUI'], $Component: 'Root', $Mount: '#app'});
</script>
```

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
## Multi-Application builds

A host project may contain several named Application graphs:

```text
project/
├── FooApp/
│   └── index.js
├── BarApp/
│   └── index.js
├── app.js
├── index.html
└── dist/
```

When `app.js` bootstraps named Applications with graph `Root` values, Builder discovers every existing graph root and bundles them into the same production `dist/app.js`:

```js
Elemenx.Application('FooApp', {
	Component: 'FooRoot',
	Root: 'FooApp',
	Mount: 'body'
});

Elemenx.Application('BarApp', {
	Component: 'BarRoot',
	Root: 'BarApp',
	Mount: '#bar'
});
```

For an explicit list, `elemenx.config.js` may use:

```js
module.exports = {
	Applications: ['FooApp', 'BarApp']
};
```

The CLI equivalent is:

```text
elemenx build --applications FooApp,BarApp
```

An explicit `--application FooApp` keeps the single-graph build behavior. Application source graphs are excluded from `dist`, including nested configured graph paths. Entity type detection is graph-layout agnostic: Components, Services, Guards and Directives are classified from their Elemenx registration when they are not stored in the legacy type directories.

The current Bundle Registry is global, so two bundled Application graphs may not define the same entity type/name pair. Builder reports that collision instead of silently overwriting one definition.