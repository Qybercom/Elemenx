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

`dist/index.html` is copied from the normal development `index.html`; a separate production HTML file is not required. `elemenx.js` goes into `dist`, so the result can be served independently of the source tree.

## What a build leaves out

A build (`dist`, `--single` and `--widget`) takes only what the Application uses:

- the Library Components it renders (by their tags), the Directives its templates put on elements (`*copy`), the Services and Guards it names in quotes (`$Service('Toast')`, `Guards: ['Auth']`), and the ones these use in turn;
- of the framework, the sections of `Router`, `Network`, `Storage`, `Events`, `Messaging`, `WebWorker` and `ServiceWorker` only when the code of the build (the entry, the page, its templates and the entities it takes) uses them: `$Router`, `$Network`, `$Storage`, `$Events` or `$OnEvent`, `$Messaging` or `$OnMessage`, `$WebWorker`, `$ServiceWorker`, or `Elemenx.Router`, `Elemenx.Network`... (`Messaging` keeps `Events`; an Application with workers keeps all of the framework, as their scripts are files a build does not read).

The build says which sections it left out. A name built at run time (`$Service(name)`) or a script of the page the build does not read cannot show a use: name the entity in quotes somewhere in the code, or build with `--full` (or `Full: true` in `elemenx.config.js`), which keeps all of the framework.

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
elemenx build [project] [--single | --widget] [--packs a,b] [--full] [--precompile]
elemenx build [project] --extension [--surface popup|tab|side] [--full]
elemenx build [project] --native [desktop|mobile] [--full]
elemenx native add [desktop|mobile|all] [project]
elemenx help [command]
elemenx dev [project] [--host 127.0.0.1] [--port 4173]
elemenx serve [project] [--host 127.0.0.1] [--port 4175]
              [--compression true|false]
              [--compression-threshold 1024]
              [--cache-control "public, max-age=0, must-revalidate"]
elemenx icons <directory> <output.svg> [--current-color]
elemenx version
```

`elemenx help` lists the commands; `elemenx help <command>` (or `elemenx <command> --help`) shows the help of one: its use, what it does and its options.

The command registry is intentionally extensible for future command groups such as `generate component`, `generate service`, `generate guard`, `generate directive`, `inspect`, and other project operations.

`elemenx icons` builds an icon set for the `Icons` Service of ElemenxUI from a directory of SVG files (Lucide, Tabler, Phosphor, exported designs...): one `<symbol>` per file, named after the file (`Arrow Left.svg` becomes `arrow-left`), with the `viewBox` of the file (or its `width` and `height`) and the `fill` and `stroke` attributes of its root, so a filled or a colored icon keeps its paint. The ids inside an icon (gradients, masks) get the name of the icon before them, so the icons do not collide in one page. `--current-color` turns every color but `none` into `currentColor`, so the icons take the color of the text.

An optional `elemenx.config.js` may export `Application`, `Entry`, `Index`, `Output`, and `Server` settings. CLI options override configuration, and configuration overrides Elemenx defaults.

Production `serve` enables gzip for compressible responses of at least 1024 bytes and sends `ETag`, `Last-Modified`, `Cache-Control`, `Vary: Accept-Encoding`, and conditional `304` responses. `HEAD` returns the same representation headers and `Content-Length` without a response body. Development serving does not compress by default. Server values follow the same precedence as the rest of the CLI: explicit CLI option, then `elemenx.config.js`, then Elemenx defaults.

## Precompiled expressions

`--precompile` (or `Precompile: true` in `elemenx.config.js`) writes the expressions of the templates into the build as code, before its bundle: one `Elemenx.Expressions({...})` call with a function for each source (see `docs/PUBLIC-API.md`). The template compiler takes them and compiles nothing, so the build runs on a page whose Content-Security-Policy forbids eval (`script-src 'self'`, the policy of a browser extension). The builder reads the templates of the build: the `$Template` strings of its definitions (written as strings or sums of strings, or read from `$TemplateURL`), the second argument of `Elemenx.Template` and the `<template>` elements of the page. It takes from them what the runtime compiles: the `{{ }}` of texts and attributes, the values of `[bindings]` and `*directives`, and the parts of a `*for`. A template made at run time (a function `$Template`, a string built from values) is not read: on such a page its expressions throw `Elemenx expression is not precompiled and the page forbids eval: <source>`. Works with every kind of build (`--single` and `--widget` too).

## A browser extension

`elemenx build --extension` makes the Application a browser extension (Manifest V3): its production build with the expressions precompiled (the policy of an extension forbids eval), in `dist/extension/chrome` (for Chrome, Edge and Vivaldi) and `dist/extension/firefox`, with `chrome.zip` and `firefox.zip` for the stores. The Application shows on a surface, `--surface` or `Extension.Surface` in `elemenx.config.js`:

- `popup` (the default): the window of the button of the extension.
- `tab`: a tab of its own, opened by the button (a background script does it).
- `side`: the side panel of Chrome (`side_panel`, the button opens it) and the sidebar of Firefox (`sidebar_action`, the button toggles it).

The manifest takes its name, description and version from the `package.json` of the project (`Extension.Name`, `Extension.Description` and `Extension.Version` win); the version keeps its numbers only (`1.2.3`). Firefox needs an id: `Extension.ID`, by default `<name>@elemenx.extension`. `icon.png` among the public files is the icon of every size, or `Extension.Icons` names them by size (`{16: 'icons/16.png', 128: 'icons/128.png'}`). `Extension.Manifest` adds keys to both manifests and wins over the ones of the build (`{permissions: ['storage'], host_permissions: ['https://api.example.com/*']}`).

The page of an extension runs no inline script: the build stops on one in `index.html` (move it into a file). On the page of an extension the Router keeps its route in memory from `/` (see the Router `Mode` in `docs/PUBLIC-API.md`).

## Native programs

`elemenx build --native` makes the Application native programs: `--native desktop` a desktop program with Electron, `--native mobile` the Android and iOS programs with Capacitor, and `--native` alone both. Elemenx carries neither (Electron is about 100 MB; the project picks their versions): `elemenx native add desktop`, `mobile`, or both without a platform, installs them into the project with npm, once (`elemenx generate application <Name> --native [desktop|mobile]` does it for a new project, and adds `npm run native`).

```bash
npx elemenx native add desktop
npx elemenx build --native desktop
```

The settings of the programs are `Native.Desktop` and `Native.Mobile` in `elemenx.config.js`.

### Desktop (Electron)

The desktop packages are `electron` and `@electron/packager` (development tools).

The build always writes `dist/native/desktop`: the production build of the Application with its expressions precompiled in `app/`, a `main.js` that opens it in a window and a `package.json`. With Electron and the packager in the project it then makes the program for the system of the build in `dist/native/desktop-bin` (`Native.Desktop.Platform` and `Native.Desktop.Arch` in `elemenx.config.js` choose another one, as the packager names them: `win32`, `darwin`, `linux`; `x64`, `arm64`). Without them it writes what to type to get there, and `npx electron dist/native/desktop` tries the Application without making a program.

The window loads the Application from `app://bundle/index.html`, a scheme of its own (standard and secure), so the absolute paths of the page, `fetch` and the Libraries work as from a server, and no request reaches a file outside the folder of the Application. The Router keeps its route in memory there, from `/`. `Native.Desktop.Name`, `Native.Desktop.Version` and `Native.Desktop.Description` (the `package.json` of the project by default), `Native.Desktop.Width` and `Native.Desktop.Height` (1200 by 800) set the program and its window.

The page has no Node (`contextIsolation`, `sandbox`): it reaches the system through the bridge of `preload.js` (`window.ElemenxNative`), which the `Native` Service of ElemenxUI uses (see `docs/LIBRARIES.md`). The main process answers the page of the Application only (`app://bundle/`), and only the features of `Native.Desktop.Features` (all by default: `window`, `dialogs`, `menu`, `tray`, `external`, `taskbar`, `hotkeys`, `autostart`, `links`, `power`, `update`; an unknown name stops the build). A link out of the Application opens in the browser of the system, never in the window. `Native.Desktop.Frame: false` takes away the frame of the system: the Application draws its own title bar, an element with the class `elemenx-native-drag` moves the window and the controls in it take `elemenx-native-nodrag`. `dist/native/desktop` holds `main.js`, `preload.js`, `elemenx-native.json` (the settings the main script reads), `package.json` and `app/`.

`Native.Desktop.Protocol: 'myapp'` gives the program links of its own: the system opens `myapp://...` with it (on Windows and Linux it is registered when the program starts, on macOS the packager writes it into the program). One program answers them: a second start hands its link to the running one and quits. The page reads the links with `Native.Links` and hears the ones that come later with the `link` event. The scheme is a name of letters, digits, `+`, `-` and `.`, and not one of the web (`http`, `file`, `app`...).

`Native.Desktop.Update: 'https://example.com/myapp/latest.json'` names the feed of the versions of the program, a JSON file the project publishes: `{"Version": "1.3.0", "URL": "https://example.com/myapp/1.3.0.zip", "Notes": "What is new"}`. `Native.Update` compares its `Version` with the version of the program and tells whether a newer one is out; the page then opens `URL` (https only) with `Native.External`. The program does not replace itself: an update that installs itself needs an installer (Squirrel, an MSI, a DMG), which the packager does not make.

### Mobile (Capacitor)

The mobile packages are `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios` and the plugins `@capacitor/app`, `@capacitor/browser` and `@capacitor/dialog` (the program needs them at run time). The project itself is the Capacitor project, as Capacitor makes it: `capacitor.config.json` (the build writes it when the project has none: `Native.Mobile.AppID`, a reverse domain name such as `com.example.app`, and `Native.Mobile.Name`), `android/` and `ios/` next to `package.json`. The build writes the production build of the Application, its expressions precompiled, in `dist/native/mobile` (the `webDir` of the config); with Capacitor in the project it adds the platforms it has installed (`Native.Mobile.Platforms`, both by default) and copies the build into them (`cap add`, `cap sync`). Without Capacitor it writes what to type. The programs are then built by their IDE: `npx cap open android` opens Android Studio, `npx cap open ios` Xcode (on a Mac), and `npx cap run android` runs the program on a device or an emulator.

The page reaches the device through `elemenx-native.js`, the bridge the build puts into the page (`window.ElemenxNative`, `Platform` `capacitor`), which the `Native` Service of ElemenxUI uses: `External` opens a link in the browser of the system (`@capacitor/browser`), `Message` shows a message of the system (`@capacitor/dialog`), `Links` and the `link` event carry the links that open the program, and the `power` event tells when it goes to the back and comes back (`@capacitor/app`). A feature without its plugin calls back an error.

## A widget

`elemenx build [project] --widget` (or `Widget: true` in `elemenx.config.js`) builds the Application as a widget for a page of another site: one `widget.js` with the framework, the Libraries the Application uses and the Application, minified and isolated.

- The window gets no `Elemenx`: the framework of the widget is a copy of its own (`ElemenxIsolated`), and the page may have an Elemenx of its own, of any version, which the widget does not touch.
- The Application renders in a shadow root of its `$Mount` (unless its definition says `$Shadow: false`): the styles of the page do not reach the widget and the ones of the widget (ElemenxUI with its `html`, `body` and `:root` rules, read as the host there) do not reach the page. The stylesheets go there through `Elemenx.Style`, the sprites and the data of the Libraries through `Elemenx.Resource`, as in a single file (the packs too, the same way: see below).
- The `lang` and `dir` of `Elemenx.Locale` and the theme of the `Theme` Service go to the host of the widget, not to the `html` and `body` of the page; the sprite of the icons has ids of its own.

The page loads the widget with `<script src="widget.js"></script>` and gives it its mount (`<div id="widget"></div>`, the `$Mount` of the Application). The `index.html` of the project becomes such a page next to `widget.js`, and the public files of the project are copied there. Limits: a URL in the widget (an image, a file of a pack left out) is read against the page, so give them absolute URLs; a widget starts no worker.

## A single file

`elemenx build [project] --single` (or `Single: true` in `elemenx.config.js`) builds the whole Application into one `index.html`: the framework, the code of the Application, its templates and styles, and the Libraries it uses (their stylesheets, and their sprites and data through `Elemenx.Resource`), inline and minified. Images and the other public files of the project are copied next to it. `index.html` must load `elemenx.js` and the entry (`app.js`) with `<script src>`: they take the places of those scripts. The framework stays a script of its own (`<script id="elemenx">`), so a `WebWorker` loads it from a `blob:` copy of its text.

The packs of a Library (its `packs.json`, see `docs/LIBRARIES.md`) go in only when the Application uses them: when its code, its templates or the Library Components it renders hold a text of the pack's `Uses` (`'Emoji'`, `'Cities'` and `CityInput`, `brands:`, `files:`, `FileIcon`, and the name of a game theme in quotes, `'fantasy'` or `'scifi'`, for ElemenxUI), and a pack of a language when it is the `lang` of `<html>` too. `--packs emoji,brands` (or `Packs: ['emoji', 'brands']` in `elemenx.config.js`; `all` for all of them) embeds packs the code cannot show, as an icon name built at run time. A file of a pack left out is not copied: from a file the page cannot load it.

The page runs from any static server and from a file (`file://`), with these limits: a browser runs no worker from a file (open the page from a server to use workers); a `ServiceWorker` needs a script file of its own; the Router keeps the route in the history entries there (Router `Mode` `'memory'`, the default for a file), so the URL of the page does not show it: use `Mode: 'hash'` for routes in the URL; a Content Security Policy must allow inline scripts and styles, and `blob:` workers.

## Distribution of the framework

`npm run dist` (`tools/dist.js`) builds the distribution of Elemenx into `dist/` (`npm test` builds it too, before it runs the browser contracts against the minified framework and the end-to-end tests):

| File | Content |
|---|---|
| `elemenx.js`, `elemenx.min.js` | the framework |
| `elemenx-ui.js`, `elemenx-ui.min.js` | ElemenxUI standalone: every component with its template and style, the stylesheets, the sprites and the data, embedded, but its packs |
| `elemenx-ui.<pack>.js`, `elemenx-ui.<pack>.min.js` | a pack of ElemenxUI: `emoji` (the emoji with their English names and keywords), `emoji.ru` (the Russian ones), `cities` (the cities of GeoNames, about 7 MB, 3.3 MB with gzip), `cities.ru` (their Russian names), `brands` and `files` (the icon sets), `fantasy` and `scifi` (the game themes: the script puts the stylesheet into the page) |
| `elemenx.all.js`, `elemenx.all.min.js` | the framework and ElemenxUI in one file |
| `elemenx-ui/` | ElemenxUI as files, for the Discovery of a project (`Elemenx.Library('ElemenxUI', {$Root: ...})`) |
| `manifest.json` | the version, and the size, the gzip size and the integrity (SRI) of every file |

The minifier (`tools/minify.js`) has no dependencies and renames nothing, so no public name can break: it drops comments (but `/*!` licenses) and the blanks that carry no meaning, and keeps a line break where a statement could end. Templates and stylesheets are minified the same way.

The standalone files need no build and no server, `file://` included: ElemenxUI registers itself, injects its styles and carries its files through `Elemenx.Resource`. The packs are large and few pages need them, so they stay out of `elemenx-ui.js`: a page adds the scripts of the ones it uses after the framework (the emoji pickers need `emoji`, `CityInput` and the `Cities` Service `cities`, the icons `brands:` and `files:` and `FileIcon` theirs, the game themes `fantasy` and `scifi` theirs). From a server a page may skip them: ElemenxUI loads the files of a pack from `elemenx-ui/` next to the script when they are first needed (not a stylesheet: a game theme needs its script); a page from a file cannot.

```html
<script src="elemenx.all.min.js"></script>
<script src="elemenx-ui.emoji.min.js"></script>
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