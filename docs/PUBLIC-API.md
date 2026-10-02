# Elemenx Public API

This document is the release-level map of the supported top-level Elemenx surface. Detailed behavior remains covered by the regression suite and the maintained examples.

## Runtime surface

- `Elemenx.Application` — application registration, ownership, mounting and lifecycle.
- `Elemenx.Component` — component definitions, templates, styles, state, bindings and lifecycle.
- `Elemenx.Template` — named Template Registry populated by DOM `<template id>` resources or application loaders; supports get/set, loaders and live `Reload`. The same registry is exposed as `Application.$Template`; Components and Services access it through `this.$Application().$Template(...)`. Component template metadata is `$Template`, so ordinary `Template` belongs to application code.
- `Elemenx.Directive` — custom behavioral directives and their lifecycle.
- `Elemenx.Service` — named services, including Application-owned instances.
- `Elemenx.Guard` — named route guards used by Application routing.
- `Elemenx.Router` — routing and browser-history facade.
- `Elemenx.Network` — transports, protocols, transfer helpers and network contexts.
- `Elemenx.Storage` — storage providers and composable storage contexts.
- `Elemenx.Events` — synchronous same-runtime event channels.
- `Elemenx.Messaging` — cross-context message channels and composable messaging contexts.
- `Elemenx.WebWorker` — Web Worker lifecycle and Messaging bridge.
- `Elemenx.ServiceWorker` — Service Worker lifecycle and registration helpers.
- `Elemenx.Bundle` — production bundle registry used before normal Discovery fallback.
- `Elemenx.Title` — document/application title facade.
- `Elemenx.RuntimeID` — runtime identifier helper.

## System namespace

Inside Elemenx definitions and runtime-owned instances, every `$*` name is reserved for Elemenx. Framework metadata uses names such as `$Template`, `$TemplateURL`, `$Style`, `$Title`, `$Component`, `$Root`, `$Mount` and `$Router`; owner APIs use `this.$Application()`, `this.$Parent()`, `this.$Service()`, `this.$Router()`, `this.$Update()` and the other `$` facades. Lifecycle hooks use `$OnCreate`, `$OnReady`, `$OnDestroy` and related `$On*` names. Ordinary names such as `Template`, `Title`, `Application`, `Router` and `Update` are application-owned and are not legacy aliases.

## Confirmed contracts

Router reuse preserves the existing route/component instance when only Params, Query or Hash change within the same matched Route; this does not create artificial lifecycle churn. Guards still participate when navigation crosses guarded route boundaries, including browser back/forward navigation.

Application-owned Services, Network resources and Workers participate in owner lifecycle cleanup. Context composition accepts the supported single-context and multi-context forms consistently across Network, Messaging and Storage.

Production bundles resolve statically bundled resources from the Bundle Registry first and retain normal Discovery as the fallback for resources not present in the bundle. This permits hybrid applications with bundled and dynamically discovered resources.

Authentication is intentionally not a Transfer/Protocol responsibility. Connection authentication belongs to connection/transport setup; application authorization remains application/server business logic.

## Tooling surface

The package exposes the `elemenx` CLI through `elemenx-cli.js`. Supported release workflows include `build`, `dev`, `serve`, and `generate` (`g`) for Application, Component, Service, Guard and Directive entities. See `docs/BUILDER.md` for build/server options and graph-aware generation.

## Release discipline

A public API addition should include a direct contract test or a stronger end-to-end test. A reproduced bug remains in the regression suite after the fix. `npm test` is the release baseline.

## Lifecycle hook naming

Lifecycle hooks are named relative to their owner. Component own readiness is `$OnReady`; Application startup uses `$OnPending`, `$OnReady` and `$OnError`. `$OnChildPending`, `$OnChildReady` and `$OnChildError` on a Component describe deferred child Component lifecycle events.

## Events

`Elemenx.Events()` creates an imperative same-runtime event socket. Components, Services and Applications expose owner-aware `$Events()`. Definitions may declare `$Events: ['channel']` and receive subscribed events through one `$OnEvent(event)` dispatcher. `event.Is(name)`, `event.Is(name, handler)` provide channel matching. `event.Is(name, pipes, handler)` adds a persistent owner-bound pipeline. Pipe descriptors are evaluated in declaration order and the pipeline instance survives subsequent deliveries to the same `Is()` rule. `Elemenx.Pipe(name, factory)` registers custom Pipe types. Built-ins are `Debouncer`, `Filter` and `Gate`. Events are synchronous unless a Pipe intentionally delays delivery (for example `Gate`), and preserve JavaScript object identity; cross-context delivery belongs to Messaging.

Pipe rule identity is positional inside one Events subscription: each matching `Is()` call has its own persistent pipeline. Keep the order of piped `Is()` rules stable between deliveries. Pipeline state is destroyed with its Events socket/owner.

## Messaging

`Elemenx.Messaging()` creates a cross-context Messaging socket. Browser contexts discover their obvious Messaging neighbours automatically. An Elemenx page running inside an iframe announces itself to `window.parent`; a page opened by another window announces itself to `window.opener`. The receiving Elemenx runtime accepts same-origin announcements and creates the reverse Window bridge automatically, so normal iframe and `window.open()` relationships require no application-level `.Window()` call. Repeated registration of the same Window/origin is deduplicated. Independent same-origin tabs and windows use the built-in `BroadcastChannel` transport and announce their runtime contexts there, so normal Messaging channels can span them without explicit wiring.

Cross-origin iframe/opener relationships use the same automatic Window handshake, but are rejected by default. `Elemenx.Messaging.Origins(originOrArray)` explicitly trusts additional origins; both runtimes must trust the other origin before a cross-origin bridge is established. `HELLO` discovery may be sent with a wildcard target because it contains no application payload; accepted `WELCOME` and Messaging traffic are pinned to the verified `event.origin`. Calling `Origins()` also repeats parent/opener discovery so trust configured immediately after Elemenx loads cannot miss the initial announcement. Independent cross-origin tabs have no browser-native Window reference or shared `BroadcastChannel` and therefore are not automatically connected.

`Elemenx.Messaging.Window(target, options)` remains the explicit low-level Window transport API for non-automatic cases. It accepts a DOM selector, iframe element or browser `Window` and attaches the resolved Window through `postMessage`. `options.Origin` is both the `postMessage` target origin and the required origin for inbound messages; when omitted it defaults to the current document origin. Use `Origin: '*'` only when the peer origin is intentionally unrestricted. Inbound packets must also come from the exact attached Window. The returned handle exposes `Target()`, `Origin()` and idempotent `Destroy()`. Components, Services and Applications expose the owner-aware `$Messaging.Window(target, options)` form; its selector is resolved inside the owner's root element while the global form resolves selectors against `document`. No `$Ref` indirection is used. Owner-created bridges are destroyed with the owner. `options.Transferable: false` can disable transferable delivery for a particular Window bridge.