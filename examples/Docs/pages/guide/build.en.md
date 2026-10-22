# Builds

`elemenx build` turns a project into what a server, a file, another site, a browser or a system runs. Every kind of build takes only what the Application uses, inlines its templates and styles, and minifies it.

| Build | Command | What it makes |
| --- | --- | --- |
| A site | `elemenx build` | `dist/` for any static server |
| One file | `elemenx build --single` | one `index.html` that runs from a server or from `file://` |
| A widget | `elemenx build --widget` | one isolated `widget.js` for a page of another site |
| A browser extension | `elemenx build --extension` | Chrome, Edge and Firefox extensions, zipped for the stores |
| Native programs | `elemenx build --native` | a desktop program (Electron), Android and iOS programs (Capacitor) |

## A site

`dist/` holds `index.html` (copied from the project), `elemenx.js`, and `app.js`: the bundle of the graph of the Application (`Elemenx.Bundle({...})`, see [Resources and bundles](/guide/resources)) followed by the original `app.js`. The other public files of the project (images, fonts, data) are copied; the sources, `node_modules` and the package files are not. `elemenx serve` serves it as production would.

## What a build leaves out

- **Components** the Application does not render: the build follows the tags of its templates, then the templates of the components it took.
- **Services, guards and directives** it does not name: it keeps the ones named in quotes in its code (`$Service('Toast')`, `Guards: ['SignedIn']`) and the directives its templates put on elements, and the ones these use in turn.
- **Parts of the framework**: Router, Network, Storage, Events, Messaging, WebWorker and ServiceWorker stay only when the code of the build uses them (`$Router`, `$Network`, `$Storage`, `$Events` or `$OnEvent`, `$Messaging` or `$OnMessage`, `$WebWorker`, `$ServiceWorker`, `Elemenx.Network`...). Messaging keeps Events; an Application with workers keeps all of the framework, since their scripts are files the build does not read.

The build says what it left out. A name built at run time (`$Service(name)`) cannot show a use: name it in quotes somewhere, or build with `--full`, which keeps all of the framework.

## Expressions as code

`--precompile` writes the expressions of the templates into the build as functions (`Elemenx.Expressions({...})`), so it runs on a page whose Content Security Policy forbids `eval`. The builder reads `$Template` texts (and sums of texts), `$TemplateURL` files, `Elemenx.Template(name, text)` and the `<template>` elements of the page; a template made at run time is not read, and its expressions throw on such a page. Extensions and native programs always precompile.

## One file

`--single` (or `Single: true`) puts the framework, the Application, its templates and styles and its libraries (their stylesheets, sprites and data through `Elemenx.Resource`) into one `index.html`, minified. The page must load `elemenx.js` and `app.js` with `<script src>`: they take their places. Images and other files are copied next to it.

The packs of a library (emoji, cities, icon sets, game themes) go in only when the Application uses them: a text of their `Uses` in its code or templates (`'Emoji'`, `CityInput`, `brands:`, `'fantasy'`), and a pack of a language when it is the `lang` of `<html>`. `--packs emoji,brands` (or `all`) adds packs the code cannot show.

The file runs from any static server and from `file://`, with limits: no worker from a file; a service worker needs a script of its own; the router keeps its route in memory (use `$Router: {Mode: 'hash'}` for routes in the URL); a Content Security Policy must allow inline scripts and styles.

## A widget

`--widget` (or `Widget: true`) builds one `widget.js` with the framework, the libraries the Application uses and the Application, isolated:

- the window gets no `Elemenx`: the widget has its own copy, and the page may have an Elemenx of any version;
- the Application renders in a shadow root of its `$Mount` (unless `$Shadow: false`): the styles of the page and of the widget do not meet;
- `lang`, `dir` and the theme go to the host of the widget, not to the page.

The page loads it with `<script src="widget.js"></script>` and gives it its mount (`<div id="widget"></div>`). URLs inside the widget are read against the page, so give them absolute addresses; a widget starts no worker.

## A browser extension

`--extension` makes a Manifest V3 extension in `dist/extension/chrome` (Chrome, Edge, Vivaldi) and `dist/extension/firefox`, with `chrome.zip` and `firefox.zip`. `--surface` (or `Extension.Surface`): `popup` (the window of the button, the default), `tab` (a tab of its own) or `side` (the side panel of Chrome, the sidebar of Firefox). The manifest takes its name, description and version from `package.json`; `Extension.ID` (Firefox), `Extension.Icons` and `Extension.Manifest` (keys added to both manifests: `permissions`, `host_permissions`...) complete it. The page of an extension runs no inline script, and its router keeps the route in memory.

## Native programs

```bash
npx elemenx native add desktop
npx elemenx build --native desktop
```

- **Desktop**: `dist/native/desktop` holds the Application, `main.js`, `preload.js` and the settings; with Electron and the packager installed, the program for the system is in `dist/native/desktop-bin` (`Native.Desktop.Platform` and `Arch` choose another one). The window loads the Application from a scheme of its own (`app://bundle/`), the page has no Node, and it reaches the system through the bridge the `Native` service of ElemenxUI uses: windows, dialogs, menus, the tray, global shortcuts, autostart, links of its own scheme (`Native.Desktop.Protocol`), power, updates. `Native.Desktop.Frame: false` lets the Application draw its own title bar.
- **Mobile**: the project becomes a Capacitor project; the build writes the Application into `dist/native/mobile`, adds the Android and iOS platforms installed, and copies it into them; Android Studio and Xcode build the programs (`npx cap open android`).

The settings are `Native.Desktop` (`Name`, `Version`, `Width`, `Height`, `Features`, `Protocol`, `Update`, `Frame`...) and `Native.Mobile` (`AppID`, `Name`, `Platforms`) in `elemenx.config.js`.

## Several Applications

A project with several Application graphs (`Shop/`, `Admin/`, each with its `index.js`) builds all the graphs its `app.js` declares into one bundle; `Applications: ['Shop', 'Admin']` (or `--applications`) names them, `--application Shop` builds one. Two graphs may not declare the same name of the same type.

## The framework

`npm run dist` in the repository of Elemenx builds the files of the distribution, in the package's `dist/`: `elemenx.js` and `elemenx.min.js`, `elemenx-ui.js` (ElemenxUI with everything embedded but its packs), a script for each pack (`elemenx-ui.emoji.js`, `elemenx-ui.cities.js`...), `elemenx.all.js` (both in one file), `elemenx-ui/` (ElemenxUI as files) and `manifest.json` (the sizes and the integrity hashes of every file). These need no build and no server.
