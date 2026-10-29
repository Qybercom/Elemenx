# Elemenx Runtime Internals

`elemenx.js` is one self-contained file made of sections; every section is an inner IIFE module of the outer function. The sections share private state only through the `Runtime` object created at the top of the file. This document lists every `Runtime.*` field, the section that owns it (assigns it) and the sections that use it.

`Runtime` is not public API. Fields can be added, renamed or removed freely, as long as this document is updated in the same change. `tests/regression/runtime-internals.test.js` fails when the code and this list disagree.

To find a section in `elemenx.js`, search for its header, for example `/* Router`. The table of contents is at the top of the file.

## Runtime

| Field | Purpose | Used by |
|---|---|---|
| `ScriptURL` | URL of the loaded `elemenx.js` (a `blob:` URL of its text when it is inline in its page); workers load the same file from it, and ElemenxUI is taken from `libraries/ElemenxUI` next to it | Library, WebWorker, ServiceWorker |
| `HasDOM` | `true` in a document, `false` inside workers | Application, Bundle, Discovery, Identity, Install, Locale, Messaging, Motion, ServiceWorker, ServiceWorker bootstrap, Splash, Style, Template and Component, Utilities, WebWorker, Widgets |
| `StartedAt` | time this runtime started | Identity |
| `Isolated` | true in an isolated build (`ElemenxIsolated`): the html element of the page is left alone | Application, Locale, Style, Widgets |
| `ShadowHosts` | the hosts of the Applications that render in a shadow root | Application, Locale, Widgets |

## Utilities

| Field | Purpose | Used by |
|---|---|---|
| `Own` | `Object.prototype.hasOwnProperty.call(object, key)`; modules alias it as `var own = Runtime.Own;` | Application, Bundle, Cache, Directive registry, Discovery, Locale, Messaging, Meta, Network, Reactive, Router, Service and Guard, Storage, Structural, Template and Component, Widgets |
| `BaseURL` | the base of the relative URLs of the document: its address, or for one that is no base (a page of a `blob:` or `about:` URL) its base URI, the root of its origin or `file:///` | Application, Bundle, Discovery |
| `AbsoluteURL` | resolves a URL against the document; in a worker the value is kept as it is | Locale, Resource, ServiceWorker, WebWorker |
| `CurrentScriptURL` | the URL of the executing script without query and hash, or `null`: the base of the relative paths of its definitions | Application, Bundle, Library, Template and Component |
| `DefinitionURL` | resolves a relative path of a definition against its `$DefinitionURL`; absolute and root paths are kept | Library, Template and Component, Application |
| `OwnerRegistry` | registry of the resources an owner created: `Add`, `Remove`, `Destroyed`, `Destroy` (destroys the rest with the owner) | Events, Messaging, WebWorker, ServiceWorker |
| `EventList` | listeners of the named events of one object: `Add`, `Remove`, `Emit` (each listener isolated, one shared event), `Clear` | Storage, WebWorker, ServiceWorker |
| `Countdown` | waits for N asynchronous steps: the callback gets the first error, or `null` once all succeeded | Discovery, Install, Library, Locale |
| `MessageListeners` | listeners of the global `message` event added through a wrapper, removable by their own callback | Messaging, WebWorker |
| `CaseName` | the own key of an object that is a key in another case (a lower-case attribute of a template for a prop), or `null` when none or several are (of a value and a method of the same letters, the value); its names are kept by their lower case for each object (read again when its count of keys changes) | Template and Component, Structural |
| `Assign` | copies the own enumerable properties of a source into a target and returns the target | Template and Component, Router, Structural, Storage, WebWorker, ServiceWorker |
| `Report` | reports an exception as an uncaught error at once, like the DOM does for event listeners (`reportError`; without it, rethrown from a timer) | Application, Install, Locale, Router, Widgets |
| `Notify` | calls one event listener in isolation: its exception is reported and the dispatch continues | Template and Component, Router, Network, Events, Messaging, Identity |
| `Invoke` | calls a callback `(error, value)` from a promise handler; an exception thrown by the callback is reported instead of being swallowed | Network, ServiceWorker |

## Outlet

| Field | Purpose | Used by |
|---|---|---|
| `Outlet` | factory of a render slot that swaps one component for another | Template and Component |

## Reactive

| Field | Purpose | Used by |
|---|---|---|
| `Reactive` | wraps a value into a tracked reactive proxy | Locale, Template and Component |
| `Effect` | runs a callback and re-runs it when its tracked dependencies change | Template and Component, Structural |
| `BatchReactive` | groups changes and flushes effects once | Locale, Template and Component |
| `Untracked` | runs a callback without recording dependencies | Structural, Template and Component |
| `TrackIteration` | records a dependency on the iteration of a collection | Structural |

## Bundle

| Field | Purpose | Used by |
|---|---|---|
| `Bundle` | production bundle registry: `Install`, `Reload`, `Ready`, `ResolvedName`, `Names` (the names of a type, those of its parts too), `Load`, `LoadType`, `Deferred` (the URL of the part of an entity not loaded yet), `Fetch` (fetches that part) | Library, Template and Component, Router, Structural, Application |

## Locale

| Field | Purpose | Used by |
|---|---|---|
| `LocaleReady` | loads the dictionaries of the current language, before an Application renders its root | Application |
| `TemplateGlobals` | the names every template expression sees under the values of its Component (`$T`) | Template and Component |

## Style

| Field | Purpose | Used by |
|---|---|---|
| `AddStyle` | keeps a stylesheet (`{Text}` or `{URL}`) in the document and in every shadow root of an Application | Discovery, Template and Component |
| `AddStyleDocument` | puts every stylesheet in the document too, for an Application of an isolated copy that renders there | Application, Widgets |
| `AddStyleRoot` | gives a shadow root of an Application every stylesheet, now and later | Application, Widgets |
| `RemoveStyle` | takes a stylesheet out of the document and of every shadow root (the Cache unloads the style of a component) | Template and Component |

## Discovery

| Field | Purpose | Used by |
|---|---|---|
| `Discovery` | development loading of `index.js` graphs (or a graph file of another name) and entity scripts for an owner (Application or Library); `Files(owner)` lists the other files its graphs name | Library, Service and Guard, Template and Component, Router, Structural, Application |

## Library

| Field | Purpose | Used by |
|---|---|---|
| `Library` | `Use(application, names, callback, discovered)`, `ResolvedURL(application, name)` and `Names(application)` for `$Use` libraries and the ones of `$Discovery` | Application, Discovery, Structural, Template and Component |

## Service and Guard

| Field | Purpose | Used by |
|---|---|---|
| `Service` | `$Service(name)` accessor: service handle in the Application of the caller (`this.$Application()`), or global without one | Template and Component |
| `ServiceForApplication` | service handle owned by a given Application | Router, Application |
| `DestroyApplicationServices` | destroys every service instance owned by an Application | Application |
| `RegisterServiceDefinition` | registers or replaces a service definition at runtime | Application |
| `ServiceDefinition` | the definition of a service registered under a name, or `null` | Meta |
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
| `Directive` | directive registry and composition policy, including the built-in `if`, `for`, `key`, `outlet`, `pending`, `error` | Template and Component, Structural, Meta |

## Template and Component

| Field | Purpose | Used by |
|---|---|---|
| `Template` | named Template Registry behind `Elemenx.Template`: `Set`, `Get`, `Has`, `Remove`, `Resolve`, `Harvest` | Application, Directive registry |
| `EvaluateExpression` | evaluates a template expression against a scope | Structural |
| `ResolveComponent` | resolves a component factory by name, through Bundle, Discovery and Libraries | Structural |
| `ResolveComponentRegistered` | returns a factory only if it is already registered and loaded | Router, Structural, Application |
| `ComponentDefinition` | the definition of a component registered and loaded under a name, or `null` | Meta |
| `ComponentNames` | the names of the components registered and loaded | Meta |
| `ComponentTag` | the name of the Component an element of a template declares: `data-elemenx-component`, otherwise its tag, in any case for an element HTML does not know | Structural |
| `ReloadComponentTemplate` | reloads the external template of a component | Application |
| `ComponentValues` | reactive state of a component instance | Structural |
| `RootAttributes` | puts the `class` and `style` of the tag of a Component on the root of its instance, taking away the ones it put before; a deferred Component takes them from its placeholder | Structural |
| `UpdateProps` | gives a Component new values of props and calls its `$OnProps` with the ones that changed (a deferred Component once it is made) | Structural, Widgets |
| `CallHandler` | calls the handler of an `(event)` when the event comes: by its name, a method of the instance or a function its state holds (set in `$OnCreate`), on the owner of that state; any other text is an expression with `$event` and `$node`, a row of a `*for` writing the names of its owner to the owner | Structural |
| `Interpolation` | the parts of a text with `{{ }}`: its texts and its expressions (`{Source}`), `\{{` a `{{` of the text; `null` without `{{` | Structural |
| `InterpolationValue` | the value of those parts: the one expression as it is, or the texts and the values as one text | Structural |
| `InertNodes` | a `WeakSet` of the parts of the templates of the instances being made that the plan of their template finds inert (no directive, no Component, no slot): `compile` of Structural passes each by once and forgets it | Structural |
| `Place` | puts an element before a node of a parent; the element of a part made of a `<Fragment>` (a row of a `*for`, the content of an `*if`) puts its nodes there, between two comments of its own | Structural |
| `Detach` | takes an element out of the page; the nodes of a part made of a `<Fragment>` go back into its element | Structural |
| `First` | the first node of an element in the page: itself, or the comment that starts the nodes of a part made of a `<Fragment>` | Structural |
| `Last` | the last one: itself, or the comment that ends them | Structural |
| `UpdateComponentRouteContext` | pushes `$Path`, `$Params`, `$Query`, `$Hash` into a routed component | Router |
| `CreateComponent` | creates an anonymous component factory from a definition | Structural |
| `BeginComponentReload` | starts a component reload: remembers live instances | Application |
| `FailComponentReload` | ends a failed component reload | Application |
| `ReloadComponentInstances` | recreates live instances after a component reload | Application |
| `ResolveOutlet` | finds a named outlet of a component | Router |
| `HasPendingComponents` | whether an element holds a deferred component that waits for its definition | Router |
| `HeadOwn` | takes the `$Title` and the `$Icon` of an owner (a Component or an Application), their `{{ }}` read in its state and followed; the page follows that owner from now | Application |
| `HeadSet` | `this.$Title(value)` and `this.$Icon(value)`: the owner gives its own title or icon, and the page follows it | Application |
| `HeadForget` | an owner destroyed: the page keeps its title and icon and follows no owner until the next | Application |
| `HeadOfPage` | the title and the icon of a page of a Router: those of its deepest component that has them, else those of the Application | Router |
| `ComponentUse` | the definitions in use or used once: `{Name, Instances, IdleSince, Cached}` | Cache |
| `EvictComponent` | unloads an idle definition: the text of its template and style, its stylesheet, the compiled expressions | Cache |
| `SleepTree` | puts to sleep the components and directives with `$OnSleep` inside an element and empties its password and card fields | Cache |
| `WakeTree` | wakes what `SleepTree` put to sleep, the ones still alive (`$OnWake`) | Cache |

## Structural

| Field | Purpose | Used by |
|---|---|---|
| `Structural` | structural host engine of a component template: conditional and collection mounting, deferred children | Template and Component |
| `ComponentHosts` | `WeakMap` tag of a Component in a template → `{Element(), Watch(callback)}`: the element of the instance that took its place, and each next one; the behavioral directives of the tag follow it | Template and Component |
| `CopyParts` | `WeakMap` copy of a tag (`$Copy`) → the part of its owner it was made in, destroyed with the copy | Template and Component |

## Cache

| Field | Purpose | Used by |
|---|---|---|
| `CacheKeeps` | whether a component that leaves its place sleeps instead of being destroyed, by the policy of `Elemenx.Cache`, `*keep` and `$KeepAlive` | Structural, Router |
| `CacheSleep` | keeps a component asleep out of the page; its place hears when the Cache destroys it | Structural, Router |
| `CacheWake` | wakes a component asleep, or tells that the Cache destroyed it | Structural, Router |
| `CacheDrop` | destroys a component asleep whose place goes away | Structural, Router |

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

## Splash

| Field | Purpose | Used by |
|---|---|---|
| `Splash` | `Ready()`: an Application is ready or failed, so the splash of the page goes unless it is held | Application |

## Application

| Field | Purpose | Used by |
|---|---|---|
| `ApplicationBoundary` | tells whether an element is the mount of another Application, so traversal stops there | Structural |
| `WhenStarted` | calls back once an Application has started (its Libraries, dictionaries, Services and Components ready), at once when it has | Widgets |

## Notes

State that only one section needs is kept as a private variable of that section, not as a `Runtime` field.
