# Elemenx Advanced

`Advanced` is the canonical executable Elemenx showcase. It is intentionally larger than `Simple`: the goal is to exercise the stable public runtime in a real Application, including ownership, lifecycle, routing, storage, cross-context messaging, workers and live Network transports.

`SHOWCASE.md` is the coverage ledger. A runtime feature is complete here when it has a meaningful executable demonstration (`YES`) or is explicitly a build/tooling workflow (`WORKFLOW`).

## Run it

This directory is a standalone example project. It uses the published `elemenx` package for the CLI, development server and `/elemenx.js` runtime.

```bash
npm install
npm run dev
```

Production workflow:

```bash
npm run build
npm run serve
```

The Builder writes `dist/`. Production resolves bundled resources first and keeps normal Discovery as the fallback for resources that are not present in the bundle.

## Application structure

```text
Advanced/
  app.js
  index.html
  elemenx.config.js
  application/
    index.js
    components/
    directives/
    guards/
    services/
  data/
  SHOWCASE.md
```

`app.js` owns the Application definition and Router. `application/index.js` is the root Discovery graph; the entity `index.js` files below it enumerate Components, Directives, Guards and Services. Components normally keep their JS, template and style resources together and resolve `$TemplateURL` / `$StyleURL` relative to the definition script.

Advanced deliberately uses both discovered resources and inline definitions. `PageLoading` demonstrates an inline template, `ComponentShowcase` uses inline Template/Style, `ComponentProbe` uses the Template Registry through `$TemplateID`, and `Layout` uses an external stylesheet.

## What the application demonstrates

The Home route is a collection of independent showcase sections rather than one monolithic demo. The current stable sections cover Component APIs and lifecycle, Router/Guards, Storage, Events + Pipes, Messaging, Workers, Network, runtime inspection/reload and the Project route context.

The Network section is intentionally extensive. It exercises owner-aware `$Network()`, Network Contexts and Protocols with real XHR, WebSocket, SSE, LongPolling and chunked Stream endpoints supplied by the local example server. WebRTC uses a local peer pair, so it needs no external signaling service. Transfer/TransferReceiver and Metrics are demonstrated both directly and by the universal two-file structured Transfer that sends the same business object through every supported transport.

Messaging demonstrates declarative IDs/channels/contexts and `Message.Is()` Pipes, then crosses browser contexts through automatic iframe/parent, opener/child and same-origin BroadcastChannel discovery. The cross-origin example requires explicit mutual `Messaging.Origins()` trust. Normal same-origin relationships do not manually create a Window bridge.

Workers use the same Messaging fabric. WebWorker demonstrates manual, lazy and automatic start modes plus Start/Stop/restart/Destroy. ServiceWorker uses the isolated `/elemenx-worker-showcase/` scope so the showcase does not take control of the Advanced page itself.

## Runtime and ownership

The examples prefer owner-aware APIs (`this.$Service()`, `this.$Storage()`, `this.$Network()`, `this.$Messaging()`, `this.$WebWorker()` and `this.$ServiceWorker()`) so resources participate in Component/Application cleanup naturally.

`RuntimeShowcase` exposes runtime/Application start timestamps and uptimes, Application/root/router/mount metadata, Application startup hooks/Bootstrap, deferred child Pending/Ready/Error, isolated child and Application destroy/recreate cycles, Service lifecycle/integration, dynamic Application Service registration and development Component/Service reload. Component reload updates the definition without replacing an already-created ordinary instance; a recreated probe uses the new generation. Network objects additionally expose their own lifecycle timestamps where the entity has a meaningful active/closed session.

## Templates, directives and structural composition

Advanced uses interpolation, one-way property/attribute/class/style bindings, explicit two-way form bindings, refs, outlets, `*if` and all supported `*for` forms. Self-closing Component tags are supported when no projected children are required.

A classic loop is written normally:

```html
<span *for="i = 0; i < 5; i++">Iteration {{i}}</span>
```

The condition may also assign a loop-local value:

```html
<div *for="i = 0; item = QueueItem(i); i++">
	<IteratorBadge [item]="item" [index]="i" />
</div>
```

Elemenx aborts runaway structural loops after 10,000 iterations.

Custom behavioral directives are discovered with the Application graph. `highlight` and `tooltip` demonstrate Create/Update/Destroy and directive-owned `context.Data`; the tooltip also owns real DOM and browser event listeners and removes them on destruction. `unless` demonstrates the public structural Directive contract with real subtree Mount/Unmount and nested Component lifecycle ownership.

## Tooling

The package CLI is the real tooling showcase; browser UI does not imitate build commands. Advanced supports `elemenx dev`, `elemenx build` and `elemenx serve`. Entity generation is available through `elemenx generate` / `elemenx g` for Application, Component, Service, Guard and Directive entities.

Repository-level tests exercise the development example and the production bundle. In particular, production E2E verifies that Advanced runs without requesting its source `/application/` graph.

## Coverage status

See `SHOWCASE.md` before adding another demo. Phase 7 is complete: every tracked public runtime capability is either an executable `YES` showcase or an explicit `WORKFLOW` concern. The ledger remains the source of truth so future additions do not duplicate behavior already covered elsewhere.

## Standard UI library

Advanced registers the built-in `libraries/ElemenxUI` graph through Application `$Use`. Open `/ui` for the executable UI Kit catalogue. Development resolves the canonical package library through the Elemenx server; production Builder bundles only reachable Library Components and copies declared public style assets.