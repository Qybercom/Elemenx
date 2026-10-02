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
| Application `$OnPending` / `$OnReady` / `$OnError` | MISSING | Add visible startup lifecycle example without making startup fragile. |
| Application `Bootstrap` | MISSING | Add a small visible bootstrap marker. |
| `Application.Name/Root/Mount/Application/Component/Router` | MISSING | Add runtime metadata/inspection showcase. |
| Application-owned `Service`, `Network`, `Storage`, `Messaging`, Workers | PARTIAL | Service/Storage are used; remaining ownership APIs need explicit examples. |
| `Application.Reload(Component/Service)` | MISSING | Add development-only reload showcase and explain production limitations. |
| `Application.Destroy` / recreate | MISSING | Contract is regression-covered; add a safe isolated secondary-Application demo rather than destroying the main showcase. |

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
| `Network`, `Storage`, `Messaging`, `WebWorker`, `ServiceWorker` owner accessors | PARTIAL | Storage is used; Network currently uses global API; add owner-aware examples. |
| `$OnCreate` / `$OnReady` / `$OnDestroy` | YES | `ComponentShowcase` and `ComponentProbe` expose create/ready/destroy behavior visibly. |
| `$OnChildPending` / `$OnChildReady` / `$OnChildError` | MISSING | Add deferred/discovered child lifecycle showcase. |
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
| `*pending` / `*error` status directives | MISSING | Add deferred resource status example. |
| custom behavioral Directive | YES | `highlight`, `tooltip`. |
| Directive Create/Update/Destroy + `context.Data` | YES | Existing custom directives. |
| custom structural Directive | MISSING | Add one intentionally small structural directive example. |

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
| Service lifecycle | PARTIAL | Add visible Create/Destroy/lazy-instantiation information. |
| Service access to Network/Storage/Messaging/Workers | MISSING | Add a dedicated integration service example. |
| dynamic Application `Service(name, definition)` | MISSING | Demonstrate in isolated runtime showcase. |

## Network

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| XHR | YES | Real same-origin request. |
| XHR transport lifecycle/events | YES | Visible event timeline. |
| owner-aware Component/Application Network | MISSING | Existing XHR uses global `Elemenx.Network`; migrate/show ownership. |
| Network Context | MISSING | Add named + composed context example. |
| Protocol | MISSING | Add a small protocol transform example. |
| WebSocket | MISSING | Add showcase with local/demo endpoint support and clear unavailable state. |
| SSE | MISSING | Add showcase with demo endpoint support and clear unavailable state. |
| LongPolling | MISSING | Add showcase with demo endpoint support and clear unavailable state. |
| Stream | MISSING | Add same-origin streaming demo if server endpoint is available; otherwise self-contained browser fixture. |
| WebRTC | MISSING | Add local peer/data-channel demo without requiring external infrastructure. |
| Transfer / TransferReceiver | MISSING | Add in-browser transfer roundtrip example. |
| Metrics | MISSING | Add metrics display around a demonstrable transport. |

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
| Pipes | MISSING | Next phase: persistent pipelines attached at `event.Is(...)`. |

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
| Messaging Pipes | MISSING | Next phase: apply the Events/Pipes model to Message processing. |
| Worker Messaging bridge | MISSING | Add WebWorker and ServiceWorker bridge demos. |

## WebWorker

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| definition / handle metadata | MISSING | Add worker card. |
| manual/lazy/auto start modes | MISSING | Demonstrate all supported start modes. |
| Start / Stop / restart / Destroy | MISSING | Interactive controls. |
| lifecycle events / State / Native | MISSING | Visible status/event timeline. |
| Messaging bridge | MISSING | Echo/transform worker example. |
| Application/component ownership | MISSING | Use owner-aware API. |

## ServiceWorker

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| registration / metadata | MISSING | Add isolated-scope demo worker. |
| Register / Update / Unregister | MISSING | Interactive controls. |
| Registered / Controlled / Reachable / State | MISSING | Visible status. |
| lifecycle events | MISSING | Visible event timeline. |
| Messaging bridge | MISSING | Roundtrip message example when controlled/reachable. |
| Application/component ownership | MISSING | Use owner-aware API. |

## Bundle, Discovery and production

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| Application Discovery graph | YES | `application/index.js` and entity indexes. |
| Template/Style URL discovery | YES | Components use discovered resources. |
| Bundle registry | WORKFLOW | `npm run build` produces the production bundle. |
| Bundle → Discovery fallback | WORKFLOW | Covered by regression/E2E; add explanatory Advanced documentation rather than artificial UI. |
| public asset copy | WORKFLOW | `/data/network-showcase.json` is copied to `dist`. |
| production server | WORKFLOW | `npm run serve`. |
| component/service reload | MISSING | Add development showcase where meaningful. |

## Global helpers

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| `Elemenx.Title` | YES | Application and Project page. |
| `Elemenx.RuntimeID` | MISSING | Add runtime metadata card. |
| `Elemenx.Bundle` | WORKFLOW | Production build/runtime concern; document and expose read-only status only if useful. |

## Tooling

| Capability | Status | Current / required showcase |
| --- | --- | --- |
| `elemenx dev` | WORKFLOW | Advanced `npm run dev`. |
| `elemenx build` | WORKFLOW | Advanced `npm run build`. |
| `elemenx serve` | WORKFLOW | Advanced `npm run serve`. |
| `elemenx generate` | WORKFLOW | Document commands in Advanced README; do not fake them inside browser UI. |
| `public/` → build output | WORKFLOW | Existing network data asset demonstrates the behavior. |

## Implementation order

1. Component completeness: TemplateID, inline Style, explicit instance API, lifecycle, events and child lifecycle.
2. Router completeness: async/leave guards, programmatic navigation and same-route reuse.
3. Storage + Events + Messaging separation and Events core.
4. WebWorker + ServiceWorker completeness and Messaging bridges.
5. Network completeness: Context/Protocol first, then long-lived transports, WebRTC, Transfer and Metrics.
6. Application/runtime inspection, isolated destroy/recreate and development Reload.
7. Final UI/navigation cleanup, Advanced README rewrite and E2E coverage for every stable showcase section.

The end condition is simple: every supported public runtime capability is either `YES`, or is explicitly classified as `WORKFLOW` because its real demonstration is the Advanced build/dev/serve workflow itself. `PARTIAL` and `MISSING` are temporary states only.

- Events + Pipes: declarative `$Events` / `$OnEvent`, imperative emit, persistent `event.Is()` pipelines with interactive Debouncer, Filter and Gate showcases.