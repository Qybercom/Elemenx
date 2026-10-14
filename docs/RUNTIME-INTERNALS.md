# Elemenx Runtime Internals

`elemenx.js` is one self-contained file made of sections; every section is an inner IIFE module of the outer function. The sections share private state only through the `Runtime` object created at the top of the file. This document lists every `Runtime.*` field, the section that owns it (assigns it) and the sections that use it.

`Runtime` is not public API. Fields can be added, renamed or removed freely, as long as this document is updated in the same change. `tests/regression/runtime-internals.test.js` fails when the code and this list disagree.

To find a section in `elemenx.js`, search for its header, for example `/* Router`. The table of contents is at the top of the file.

## Runtime

| Field | Purpose | Used by |
|---|---|---|
| `ScriptURL` | URL of the loaded `elemenx.js` (a `blob:` URL of its text when it is inline in its page); workers load the same file from it | WebWorker, ServiceWorker |
| `HasDOM` | `true` in a document, `false` inside workers | Utilities, Identity, Discovery, Template and Component, Messaging, WebWorker, ServiceWorker, Application, ServiceWorker bootstrap |
| `StartedAt` | time this runtime started | Identity |

## Utilities

| Field | Purpose | Used by |
|---|---|---|
| `Own` | `Object.prototype.hasOwnProperty.call(object, key)`; modules alias it as `var own = Runtime.Own;` | Reactive, Bundle, Discovery, Service and Guard, Directive registry, Template and Component, Router, Structural, Network, Storage, Messaging, Application |
| `AbsoluteURL` | resolves a URL against the document; in a worker the value is kept as it is | Resource, WebWorker, ServiceWorker |
| `CurrentScriptURL` | the URL of the executing script without query and hash, or `null`: the base of the relative paths of its definitions | Library, Template and Component, Application |
| `DefinitionURL` | resolves a relative path of a definition against its `$DefinitionURL`; absolute and root paths are kept | Library, Template and Component, Application |
| `OwnerRegistry` | registry of the resources an owner created: `Add`, `Remove`, `Destroyed`, `Destroy` (destroys the rest with the owner) | Events, Messaging, WebWorker, ServiceWorker |
| `EventList` | listeners of the named events of one object: `Add`, `Remove`, `Emit` (each listener isolated, one shared event), `Clear` | Storage, WebWorker, ServiceWorker |
| `Countdown` | waits for N asynchronous steps: the callback gets the first error, or `null` once all succeeded | Discovery, Library |
| `MessageListeners` | listeners of the global `message` event added through a wrapper, removable by their own callback | Messaging, WebWorker |
| `Assign` | copies the own enumerable properties of a source into a target and returns the target | Template and Component, Router, Structural, Storage, WebWorker, ServiceWorker |
| `Report` | reports an exception as an uncaught error at once, like the DOM does for event listeners (`reportError`; without it, rethrown from a timer) | Router |
| `Notify` | calls one event listener in isolation: its exception is reported and the dispatch continues | Template and Component, Router, Network, Events, Messaging |
| `Invoke` | calls a callback `(error, value)` from a promise handler; an exception thrown by the callback is reported instead of being swallowed | Network, ServiceWorker |

## Outlet

| Field | Purpose | Used by |
|---|---|---|
| `Outlet` | factory of a render slot that swaps one component for another | Template and Component |

## Reactive

| Field | Purpose | Used by |
|---|---|---|
| `Reactive` | wraps a value into a tracked reactive proxy | Template and Component |
| `Effect` | runs a callback and re-runs it when its tracked dependencies change | Template and Component, Structural |
| `BatchReactive` | groups changes and flushes effects once | Template and Component |
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
| `EvaluateExpression` | evaluates a template expression against a scope | Structural |
| `ResolveComponent` | resolves a component factory by name, through Bundle, Discovery and Libraries | Structural |
| `ResolveComponentRegistered` | returns a factory only if it is already registered and loaded | Router, Structural, Application |
| `ReloadComponentTemplate` | reloads the external template of a component | Application |
| `ComponentValues` | reactive state of a component instance | Structural |
| `UpdateComponentRouteContext` | pushes `$Path`, `$Params`, `$Query`, `$Hash` into a routed component | Router |
| `CreateComponent` | creates an anonymous component factory from a definition | Structural |
| `BeginComponentReload` | starts a component reload: remembers live instances | Application |
| `FailComponentReload` | ends a failed component reload | Application |
| `ReloadComponentInstances` | recreates live instances after a component reload | Application |
| `ResolveOutlet` | finds a named outlet of a component | Router |

## Structural

| Field | Purpose | Used by |
|---|---|---|
| `Structural` | structural host engine of a component template: conditional and collection mounting, deferred children | Template and Component |

## Network

| Field | Purpose | Used by |
|---|---|---|
| `NetworkFor` | owner-aware `$Network` accessor | Owner resources, Application |
| `DestroyNetworkOwner` | destroys the Network resources created by an owner | Owner resources |

## Storage

| Field | Purpose | Used by |
|---|---|---|
| `StorageFor` | owner-aware `$Storage` accessor | Owner resources |

## Events

| Field | Purpose | Used by |
|---|---|---|
| `CreatePipeline` | creates a Pipe pipeline (shared with Messaging) | Messaging |
| `EventsFor` | owner-aware `$Events` accessor | Owner resources, Application |
| `InitializeEventsOwner` | subscribes the `$Events` channels of a definition and routes them to `$OnEvent` | Owner resources |
| `DestroyEventsOwner` | destroys the Events sockets of an owner | Owner resources |

## Messaging

| Field | Purpose | Used by |
|---|---|---|
| `SetMessagingEntity` | records the name and index of a Messaging owner, used in message sources | Owner resources |
| `MessagingFor` | owner-aware `$Messaging` accessor | Owner resources, Application |
| `InitializeMessagingOwner` | subscribes the `$Messaging` channels of a definition and routes them to `$OnMessage` | Owner resources |
| `AttachMessagingBridge` | connects an endpoint (worker, window, channel) to the Messaging fabric | WebWorker, ServiceWorker |
| `DestroyMessagingOwner` | destroys the Messaging sockets and bridges of an owner | Owner resources |

## WebWorker

| Field | Purpose | Used by |
|---|---|---|
| `WebWorkerFor` | owner-aware `$WebWorker` accessor | Owner resources, Application |
| `PrepareMessagingSend` | starts lazy workers that listen to a channel before a message is sent to it | Messaging |
| `DestroyWebWorkerOwner` | terminates the workers created by an owner | Owner resources |
| `AttachWorkerMessaging` | inside a worker: connects the worker scope to Messaging | ServiceWorker bootstrap |

## ServiceWorker

| Field | Purpose | Used by |
|---|---|---|
| `ServiceWorkerFor` | owner-aware `$ServiceWorker` accessor | Owner resources, Application |
| `DestroyServiceWorkerOwner` | releases the service worker handles of an owner | Owner resources |

## Owner resources

| Field | Purpose | Used by |
|---|---|---|
| `AttachOwnerFacades` | sets `$Network`, `$Storage`, `$WebWorker`, `$ServiceWorker`, `$Messaging`, `$Events` and the Messaging identity of a Service or Component | Service and Guard, Template and Component |
| `InitializeOwnerSubscriptions` | subscribes the `$Events` and `$Messaging` channels declared by a definition | Service and Guard, Template and Component, Application |
| `DestroyOwnerResources` | releases everything an owner created, in this order: Network, Messaging, Events, WebWorker, ServiceWorker | Service and Guard, Template and Component, Application |

## Application

| Field | Purpose | Used by |
|---|---|---|
| `ApplicationBoundary` | tells whether an element is the mount of another Application, so traversal stops there | Structural |

## Notes

State that only one section needs is kept as a private variable of that section, not as a `Runtime` field.
