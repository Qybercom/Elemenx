# Elemenx Runtime Internals

`elemenx.js` is one self-contained file made of sections: inner IIFE modules plus two sections at the top level of the outer function. The sections share private state only through the `Runtime` object created at the top of the file. This document lists every `Runtime.*` field, the section that owns it (assigns it) and the sections that use it.

`Runtime` is not public API. Fields can be added, renamed or removed freely, as long as this document is updated in the same change. `tests/regression/runtime-internals.test.js` fails when the code and this list disagree.

To find a section in `elemenx.js`, search for its header, for example `/* Router`. The table of contents is at the top of the file.

## Runtime

| Field | Purpose | Used by |
|---|---|---|
| `ScriptURL` | URL of the loaded `elemenx.js`; workers load the same file from it | WebWorker, ServiceWorker |
| `HasDOM` | `true` in a document, `false` inside workers | Identity, Discovery, Template and Component, Messaging, WebWorker, ServiceWorker, Application, ServiceWorker bootstrap |
| `StartedAt` | time this runtime started | Identity |

## Identity

| Field | Purpose | Used by |
|---|---|---|
| `ID` | identifier of this runtime, created once by `Elemenx.RuntimeID()` | Identity only |

## Outlet

| Field | Purpose | Used by |
|---|---|---|
| `Outlet` | factory of a render slot that swaps one component for another | Template and Component |

## Collection

| Field | Purpose | Used by |
|---|---|---|
| `Collection` | keyed list renderer used by collection hosts | Template and Component, Structural |

## Reactive

| Field | Purpose | Used by |
|---|---|---|
| `Reactive` | wraps a value into a tracked reactive proxy | Template and Component |
| `Effect` | runs a callback and re-runs it when its tracked dependencies change | Template and Component, Structural |
| `BatchReactive` | groups changes and flushes effects once | Template and Component |
| `Raw` | returns the original object behind a reactive proxy | not used yet |
| `Untracked` | runs a callback without recording dependencies | Structural |
| `TrackIteration` | records a dependency on the iteration of a collection | Structural |

## Bundle

| Field | Purpose | Used by |
|---|---|---|
| `Bundle` | production bundle registry: `Install`, `Reload`, `Ready`, `ResolvedName`, `Load`, `LoadType` | Library, Template and Component, Router, Structural, Application |

## Discovery

| Field | Purpose | Used by |
|---|---|---|
| `Discovery` | development loading of `index.js` graphs and entity scripts for an owner (Application or Library) | Library, Service and Guard, Template and Component, Router, Structural, Application |

## Library

| Field | Purpose | Used by |
|---|---|---|
| `Library` | `Use(application, names, callback)` and `ResolvedURL(application, name)` for `$Use` libraries | Discovery, Structural, Application |

## Service and Guard

| Field | Purpose | Used by |
|---|---|---|
| `Service` | `$Service(name)` accessor: service handle in the Application of the caller (`this.$Application()`), or global without one | Template and Component |
| `ServiceForApplication` | service handle owned by a given Application | Router, Application |
| `DestroyApplicationServices` | destroys every service instance owned by an Application | Application |
| `RegisterServiceDefinition` | registers or replaces a service definition at runtime | Application |
| `RefreshDeferredService` | refreshes the handle of a service reloaded through Discovery | Application |
| `ResolveGuard` | resolves a guard name or function to a guard function | Router |

## Router ownership

| Field | Purpose | Used by |
|---|---|---|
| `ComponentRouters` | `WeakMap` component → Router attached to it | Template and Component |
| `ComponentRouterFacades` | `WeakMap` component → cached `$Router()` facade | Router ownership only |
| `ActiveRouter` | Router currently creating components (set by `WithRouter`) | Template and Component |
| `RouterFor` | `$Router()` facade of a component | Template and Component |
| `AttachRouter` | attaches a Router to a component | Template and Component, Router |
| `DetachRouterOwner` | detaches and destroys the Router of a destroyed component | Template and Component |
| `WithRouter` | runs a callback with `ActiveRouter` set | Router |

## Directive registry

| Field | Purpose | Used by |
|---|---|---|
| `Directive` | directive registry and composition policy, including the built-in `if`, `for`, `key`, `outlet`, `pending`, `error` | Template and Component, Structural |

## Template and Component

| Field | Purpose | Used by |
|---|---|---|
| `Template` | named Template Registry behind `Elemenx.Template`: `Set`, `Get`, `Has`, `Remove`, `Resolve`, `Harvest` | Application |
| `CompileExpression` | compiles a template expression into a cached function of a scope | Template and Component only |
| `EvaluateExpression` | evaluates a template expression against a scope | Structural |
| `ResolveComponent` | resolves a component factory by name, through Bundle, Discovery and Libraries | Structural |
| `ResolveComponentRegistered` | returns a factory only if it is already registered and loaded | Router, Structural, Application |
| `ReloadComponentTemplate` | reloads the external template of a component | Application |
| `ComponentValues` | reactive state of a component instance | Structural |
| `UpdateComponentRouteContext` | pushes `$Path`, `$Params`, `$Query`, `$Hash` into a routed component | Router |
| `CreateComponent` | creates an anonymous component factory from a definition | Structural |
| `BeginComponentReload` | starts a component reload: remembers live instances | Application |
| `FailComponentReload` | ends a failed component reload | Application |
| `ReloadTemplateInstances` | re-renders the components that use a reloaded named template | Template and Component only |
| `ReloadComponentInstances` | recreates live instances after a component reload | Application |
| `ComponentReloading` | `true` while instances are recreated by a reload | Template and Component only |
| `ResolveOutlet` | finds a named outlet of a component | Router |

## Structural

| Field | Purpose | Used by |
|---|---|---|
| `Structural` | structural host engine of a component template: conditional and collection mounting, deferred children | Template and Component |

## Network

| Field | Purpose | Used by |
|---|---|---|
| `NetworkFor` | owner-aware `$Network` accessor | Service and Guard, Template and Component, Application |
| `DestroyNetworkOwner` | destroys the Network resources created by an owner | Service and Guard, Template and Component, Application |

## Storage

| Field | Purpose | Used by |
|---|---|---|
| `StorageFor` | owner-aware `$Storage` accessor | Service and Guard, Template and Component |

## Events

| Field | Purpose | Used by |
|---|---|---|
| `CreatePipeline` | creates a Pipe pipeline (shared with Messaging) | Messaging |
| `EventsFor` | owner-aware `$Events` accessor | Service and Guard, Template and Component, Application |
| `InitializeEventsOwner` | subscribes the `$Events` channels of a definition and routes them to `$OnEvent` | Service and Guard, Template and Component, Application |
| `DestroyEventsOwner` | destroys the Events sockets of an owner | Service and Guard, Template and Component, Application |

## Messaging

| Field | Purpose | Used by |
|---|---|---|
| `SetMessagingEntity` | records the name and index of a Messaging owner, used in message sources | Service and Guard, Template and Component |
| `MessagingFor` | owner-aware `$Messaging` accessor | Service and Guard, Template and Component, Application |
| `InitializeMessagingOwner` | subscribes the `$Messaging` channels of a definition and routes them to `$OnMessage` | Service and Guard, Template and Component, Application |
| `AttachMessagingBridge` | connects an endpoint (worker, window, channel) to the Messaging fabric | WebWorker, ServiceWorker |
| `MessagingBroadcastChannel` | `BroadcastChannel` shared by same-origin tabs | Messaging only |
| `MessagingBroadcastBridge` | Messaging bridge over `MessagingBroadcastChannel` | not read; keeps the bridge referenced |
| `DestroyMessagingOwner` | destroys the Messaging sockets and bridges of an owner | Service and Guard, Template and Component, Application |

## WebWorker

| Field | Purpose | Used by |
|---|---|---|
| `WebWorkerFor` | owner-aware `$WebWorker` accessor | Service and Guard, Template and Component, Application |
| `PrepareMessagingSend` | starts lazy workers that listen to a channel before a message is sent to it | Messaging |
| `DestroyWebWorkerOwner` | terminates the workers created by an owner | Service and Guard, Template and Component, Application |
| `AttachWorkerMessaging` | inside a worker: connects the worker scope to Messaging | ServiceWorker bootstrap |

## ServiceWorker

| Field | Purpose | Used by |
|---|---|---|
| `ServiceWorkerFor` | owner-aware `$ServiceWorker` accessor | Service and Guard, Template and Component, Application |
| `DestroyServiceWorkerOwner` | releases the service worker handles of an owner | Service and Guard, Template and Component, Application |

## Application

| Field | Purpose | Used by |
|---|---|---|
| `ApplicationMountOwner` | Application mounted on a given element | Application only |
| `ApplicationBoundary` | tells whether an element is the mount of another Application, so traversal stops there | Structural |

## Candidates for cleanup

Fields that no other section reads could become private variables of their section: `Raw` (unused), `MessagingBroadcastBridge` (never read), `CompileExpression`, `ComponentReloading`, `ComponentRouterFacades`, `ReloadTemplateInstances`, `ApplicationMountOwner`, `MessagingBroadcastChannel`, `ID`.
