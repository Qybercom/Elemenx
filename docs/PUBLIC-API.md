# Elemenx Public API

This document is the release-level map of the supported top-level Elemenx surface. Detailed behavior remains covered by the regression suite and the maintained examples.

## Runtime surface

- `Elemenx.Application` — application registration, ownership, mounting and lifecycle.
- `Elemenx.Component` — component definitions, templates, styles, state, bindings and lifecycle.
- `Elemenx.Template` — named Template Registry populated by DOM `<template id>` resources or application loaders; supports get/set, loaders and live `Reload`. The same registry is exposed as `Application.Template`; Components and Services access it through `this.Application().Template(...)`, leaving Component `Template` reserved for the component definition itself.
- `Elemenx.Directive` — custom behavioral directives and their lifecycle.
- `Elemenx.Service` — named services, including Application-owned instances.
- `Elemenx.Guard` — named route guards used by Application routing.
- `Elemenx.Router` — routing and browser-history facade.
- `Elemenx.Network` — transports, protocols, transfer helpers and network contexts.
- `Elemenx.Storage` — storage providers and composable storage contexts.
- `Elemenx.Messaging` — channels and composable messaging contexts.
- `Elemenx.WebWorker` — Web Worker lifecycle and Messaging bridge.
- `Elemenx.ServiceWorker` — Service Worker lifecycle and registration helpers.
- `Elemenx.Bundle` — production bundle registry used before normal Discovery fallback.
- `Elemenx.Title` — document/application title facade.
- `Elemenx.RuntimeID` — runtime identifier helper.

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

Lifecycle hooks are named relative to their owner. Component own readiness is `ElemenxOnReady`; Application startup uses `ElemenxOnPending`, `ElemenxOnReady` and `ElemenxOnError`. `ElemenxOnChildPending`, `ElemenxOnChildReady` and `ElemenxOnChildError` on a Component describe deferred child Component lifecycle events.