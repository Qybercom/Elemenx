# Elemenx Advanced showcase coverage

`Advanced` is the canonical executable showcase for the supported Elemenx public surface. A public feature should be represented here when it can be demonstrated meaningfully in an application. Tooling-only and production-only features are demonstrated by the project workflow rather than duplicated as artificial UI controls.

Status values:

- `YES` — already demonstrated directly in the current Advanced application.
- `PARTIAL` — the subsystem is present, but part of its public behavior is not demonstrated.
- `MISSING` — supported public behavior has no Advanced demonstration yet.
- `WORKFLOW` — demonstrated by building/running Advanced rather than by an in-page widget.

## Application and lifecycle

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| `Elemenx.Application` registration | YES | `app.js` registers `ApplicationExample`. |
| `Title`, `Component`, `Root`, `Mount` | YES | Main application definition. |
| Application Router configuration | YES | Routes, Waiting and NotFound are configured in `app.js`. |
| Application `$OnPending` / `$OnReady` / `$OnError` | YES | `ApplicationExample` records startup hook calls and `RuntimeShowcase` displays Pending/Ready/Error counters without forcing an error. |
| Application `$Bootstrap` | YES | `ApplicationExample.$Bootstrap` creates the startup marker before root construction; `RuntimeShowcase` displays its timestamp. |
| `Application.Name/Root/Mount/Application/Component/Router` | YES | `RuntimeShowcase` inspects the current Application, root, Router and mount through the public facade. |
| Application-owned `Service`, `Network`, `Storage`, `Messaging`, Workers | YES | Advanced uses owner-aware facades throughout the component tree; owner cleanup is regression-covered. |
| `Application.Reload(Component/Service)` | YES | `RuntimeShowcase` demonstrates both Component and Service definition reload through `Application.$Reload()`. |
| `Application.Destroy` / recreate | YES | `RuntimeShowcase` mounts a secondary Application into an isolated mount, destroys it completely and recreates the same registered Application name with a fresh root instance. |

## Component

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| Component registration | YES | Used throughout Advanced. |
| `TemplateURL` | YES | Most components. |
| inline `Template` | YES | `PageLoading`. |
| `TemplateID` | YES | `ComponentProbe` resolves `AdvancedComponentProbeTemplate` through the Template Registry; the DOM `<template id>` is harvested automatically. Registry access is global through `Elemenx.Template` and Application-scoped ergonomically through `Application.Template` / `this.$Application().Template(...)`. |
| `StyleURL` | YES | `Layout`. |
| inline `Style` | YES | `ComponentShowcase` carries its showcase CSS directly in the definition. |
| reactive values / interpolation | YES | Home, Layout and nested showcases. |
| `Update` | YES | `ComponentShowcase.UpdateHost()` calls the public `Update()` API explicitly. |
| `Batch` | YES | Network showcase and state changes. |
| `Ref` | YES | `ComponentShowcase` visibly resolves `#HostStatus` and mounts the probe through `#ProbeMount`. |
| `On` / `Emit` component events | YES | The host subscribes with `probe.$On()` and `ComponentProbe` emits `change` and lifecycle events. |
| `Parent` | YES | The programmatic child is assigned to the host and reports its `Parent()`. |
| `Application` | YES | `ComponentProbe.DescribeOwner()` reports the owning Application name. |
| `Element` / `Generation` | YES | The showcase checks `Element()` and reports the child component generation. |
| `Router` | YES | `RouterShowcase` reaches the Application Router from a nested Component; route-owned `RouterLabPage` and `LeaveGuardPage` use their attached Component Router facade directly. |
| `Service` | YES | Session service. |
| `Title` | YES | `ProjectPage`. |
| `Network`, `Storage`, `Messaging`, `WebWorker`, `ServiceWorker` owner accessors | YES | Network, Storage, Messaging and Worker showcases use their Component-owned `$*` facades. |
| `$OnCreate` / `$OnReady` / `$OnDestroy` | YES | `ComponentShowcase` and `ComponentProbe` expose create/ready/destroy behavior visibly. |
| `$OnChildPending` / `$OnChildReady` / `$OnChildError` | YES | `RuntimeShowcase` observes real deferred TemplateID Pending → Ready and missing TemplateURL Error transitions. |
| route `Path`, `Params`, `Query`, `Hash` context | YES | Project route exercises params/query/hash. |

## Templates, bindings and directives

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| `{{expression}}` interpolation | YES | Used throughout. |
| `[property]` component/DOM binding | YES | Nested components. |
| `[property.*]`, `[attribute.*]`, `[class.*]`, `[style.*]` | YES | Existing nested showcase. |
| `(event)` | YES | Buttons and controls. |
| `[(value)]`, `[(checked)]`, `[(selected)]` | YES | Home two-way binding showcase. |
| `#ref` | YES | Layout/Home/Network markup. |
| `*if` | YES | Project showcase. |
| `*for` collection | YES | Projects. |
| `*for` keyed collection / `*key` | YES | Project cards. |
| classic counter `*for` | YES | Iterator showcase. |
| assignment-condition `*for` | YES | Deployment queue. |
| `*outlet` | YES | Content and Waiting outlets. |
| `*pending` / `*error` status directives | YES | `RuntimeShowcase` renders live pending/error placeholders on deferred child Components. |
| custom behavioral Directive | YES | `highlight`, `tooltip`. |
| Directive Create/Update/Destroy + `context.Data` | YES | Existing custom directives. |
| custom structural Directive | YES | `unless` uses the public Structural host (`Mount` / `Unmount`) and owns a nested Component instance. |

## Router and guards

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| static route | YES | Home/Authorized. |
| route params | YES | `/project/:id`. |
| query/hash context | YES | Project navigation link. |
| single Guard | YES | Authorized route. |
| composed Guards | YES | Project route. |
| rendered `GuardFailed` | YES | LoginRequired/AccessDenied. |
| Guard redirect | YES | AuthorizedRedirect. |
| Waiting component | YES | PageLoading. |
| NotFound component | YES | PageNotFound. |
| route leave guard | YES | `LeaveGuardPage` visibly denies navigation until leave permission is enabled. |
| async Guard / `Wait` | YES | `DelayedAccess` uses `this.Wait(...)`; the route shows the normal Waiting component until it resolves. |
| Router programmatic navigation/history facade | YES | Router lab exposes Go, Replace, Back and Forward through `this.$Router()`. |
| same-route Params/Query/Hash reuse | YES | Router lab changes Params/Query/Hash while showing stable Generation and Ready count. |

## Services

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| `Elemenx.Service` definition | YES | Session. |
| Application-owned service instance | YES | Session is resolved through components/guards. |
| service methods/state | YES | Authorization/project access. |
| Service lifecycle | YES | `RuntimeService` visibly demonstrates lazy Application-owned creation, `$StartedAt()`, `$Generation()`, destroy/recreate and reload-driven redefinition. |
| Service access to Network/Storage/Messaging/Workers | YES | `IntegrationService` exercises its own `$Network()`, `$Storage()`, `$Messaging()`, `$WebWorker()` and `$ServiceWorker()` owner-aware facades; the showcase also proves that destroying the Service stops its owned WebWorker and recreating the Service creates a fresh running Worker. |
| dynamic Application `Service(name, definition)` | YES | `RuntimeShowcase` registers `RuntimeDynamicService` at runtime through `Application.$Service(name, definition)`, proves lazy Application-owned creation, destroy and fresh recreation. |

## Network

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| XHR | YES | Real same-origin request. |
| XHR transport lifecycle/events | YES | Visible event timeline. |
| owner-aware Component/Application Network | YES | `NetworkShowcase` uses `this.$Network()` and a named owner-aware Network Context. |
| Network Context | YES | `AdvancedNetworkAPI` composes Network configuration used by the live showcase. |
| Protocol | YES | Advanced JSON, NDJSON, Quark and transfer protocols are exercised by live transports. |
| WebSocket | YES | Local Quark packet flow against the Advanced server. |
| SSE | YES | Live three-event server stream decoded through Protocol. |
| LongPolling | YES | Held-request loop against the Advanced server. |
| Stream | YES | Real chunked HTTP response with NDJSON reconstruction. |
| WebRTC | YES | Local peer pair and binary RTCDataChannel transfer without external infrastructure. |
| Transfer / TransferReceiver | YES | High-level roundtrip plus the universal two-file structured Transfer showcase. |
| Metrics | YES | Automatic WebRTC telemetry and per-transport universal Transfer metrics. |

## Storage

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| Local storage | YES | Theme persistence. |
| Namespace | YES | `AdvancedExample`. |
| Session storage | YES | Storage card exposes Set/Get/Has/Remove/Clear behavior. |
| Cookie storage | YES | Storage card uses a namespaced cookie with explicit Path. |
| IndexedDB | YES | Store Put/Get, index GetAll and a readwrite Transaction are executed live. |
| Storage Context | YES | `AdvancedStorageShowcase` composes the base namespace and IndexedDB schema. |
| Get/Set/Has/Remove/Clear | YES | Interactive Local/Session/Cookie CRUD and namespace Clear are explicit. |

## Events

| Capability | Status | Advanced evidence |
| --- | --- | --- |
| Same-runtime event bus | YES | Events card emits and receives local events synchronously. |
| Declarative `$Events` | YES | `EventsShowcase` declares two channel names. |
| `$OnEvent` dispatcher + `event.Is()` | YES | One dispatcher routes both channels through `event.Is()`. |
| Owner cleanup | YES | Runtime regression covers destroyed Component subscriptions. |
| Pipes | YES | Interactive Debouncer, Filter and Gate pipelines are attached through `event.Is(...)`. |

## Messaging

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| declarative `$Messaging` ID | YES | `MessagingIDReceiver` uses the string overload and accepts a direct message. |
| declarative `$Messaging` Channels | YES | `MessagingChannelsReceiver` uses the array overload for `advanced:foo` and `advanced:bar`. |
| declarative Context composition | YES | `MessagingContextReceiver` composes inherited Context channels with a local channel and shared custom ID. |
| `$OnMessage` / `Message.Is()` | YES | All declarative receivers route delivered messages through one `$OnMessage` handler using `Message.Is()`. |
| Messaging Pipes | YES | `Message.Is(channel, pipes, handler)` demonstrates the shared `Debouncer`, `Filter` and `Gate` pipeline semantics. |
| imperative `Send` | YES | The showcase sender drives direct, channel, Context and shared-ID deliveries. |
| owner lifecycle | YES | Declarative receiver sockets and the sender are Component-owned and cleaned up with their owners. |
| Browser context discovery | YES | `MessagingShowcase` demonstrates zero-config iframe/parent and child/opener discovery, independent same-origin tabs through BroadcastChannel (opened with `noopener`), and an explicitly trusted cross-origin child through `Messaging.Origins()`. No normal same-origin example calls `.Window()` manually. |
| Worker Messaging bridge | YES | `WorkerShowcase` sends and receives worker traffic through the same Messaging fabric. |

## WebWorker

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| definition / handle metadata | YES | Worker card exposes names, channels, start modes, state and native handle availability. |
| manual/lazy/auto start modes | YES | Three owner-aware workers demonstrate all start modes. |
| Start / Stop / restart / Destroy | YES | Interactive manual-worker controls plus handle recreation. |
| lifecycle events / State / Native | YES | Worker lifecycle and current State/Native status are visible. |
| Messaging bridge | YES | Manual/lazy/auto workers reply through Messaging. |
| Application/component ownership | YES | `WorkerShowcase` creates workers through `this.$WebWorker()`. |

## ServiceWorker

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| registration / metadata | YES | Isolated `/elemenx-worker-showcase/` ServiceWorker exposes handle metadata. |
| Register / Update / Unregister | YES | Interactive controls call the public ServiceWorker handle. |
| Registered / Controlled / Reachable / State | YES | All four values are displayed and refreshable. |
| lifecycle events | YES | Installing/Waiting/Active/Unregistering/Unregistered/Error are surfaced visibly. |
| Messaging bridge | YES | Reachable worker roundtrip uses the common Messaging sender. |
| Application/component ownership | YES | `WorkerShowcase` creates workers through `this.$WebWorker()`. |

## Bundle, Discovery and production

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| Application Discovery graph | YES | `application/index.js` and entity indexes. |
| Template/Style URL discovery | YES | Components use discovered resources. |
| Bundle registry | WORKFLOW | `npm run build` produces the production bundle. |
| Bundle → Discovery fallback | WORKFLOW | Covered by regression/E2E; add explanatory Advanced documentation rather than artificial UI. |
| public asset copy | WORKFLOW | `/data/network-showcase.json` is copied to `dist`. |
| production server | WORKFLOW | `npm run serve`. |
| component/service reload | YES | `RuntimeShowcase` reloads the discovered `RuntimeProbe` definition through `Application.$Reload()` and reports completion without replacing the application. |

## Application / runtime lifecycle

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| runtime inspection | YES | `RuntimeShowcase` displays `RuntimeID`, runtime/Application `StartedAt`, their uptimes, Application name, current root, Router presence and mount through public APIs. |
| isolated destroy / recreate | YES | A manually owned `RuntimeProbe` can be destroyed and recreated without disturbing the Application or sibling showcases. |
| development Component reload | YES | `Application.$Reload('Component', 'RuntimeProbe', ...)` reloads the discovered definition without replacing the existing ordinary instance; recreating the probe then uses the new definition generation. |

## Global helpers

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| `Elemenx.Title` | YES | Application and Project page. |
| `Elemenx.RuntimeID` | YES | `RuntimeShowcase` displays the current runtime ID, runtime/Application start timestamps and uptimes together with Application/root/router/mount metadata; the inspection sequence and uptimes visibly change on refresh. |
| `Elemenx.Bundle` | WORKFLOW | Production build/runtime concern; document and expose read-only status only if useful. |

## Tooling

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| `elemenx dev` | WORKFLOW | Advanced `npm run dev`. |
| `elemenx build` | WORKFLOW | Advanced `npm run build`. |
| `elemenx serve` | WORKFLOW | Advanced `npm run serve`. |
| `elemenx generate` | WORKFLOW | Document commands in Advanced README; do not fake them inside browser UI. |
| `public/` → build output | WORKFLOW | Existing network data asset demonstrates the behavior. |

## Phase 7 status

Phase 7 is complete. Every supported public runtime capability tracked by this ledger is represented either by an executable `YES` showcase or by a real `WORKFLOW` build/tooling path. There are no remaining `PARTIAL` or `MISSING` rows.

The final audit covers Component and Application lifecycle, Router/Guards, behavioral and structural Directives, Services (including runtime registration and owner-aware integrations), Storage, Events/Pipes, Messaging/browser contexts, Workers, Network/Transfer/Metrics, Discovery/Bundle workflow and production E2E.

Lifecycle timestamps are part of the current runtime contract: Component and Service instances expose `$StartedAt()`. Networking runtime instances expose `$StartedAt()`; XHR, Stream, LongPolling, SSE, WebSocket and WebRTC additionally expose `$ConnectedAt()` / `$ClosedAt()` for their latest connection/exchange. Transfer owns an independent set of all three timestamps.

`Application.$Reload()` reloads definitions. Service reload destroys the current Application-owned Service instance and the next access creates the new generation. Component reload does not replace an already-created ordinary Component instance; a subsequently created instance uses the reloaded definition generation. README and E2E coverage are maintained alongside the executable showcase.