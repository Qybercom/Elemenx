# Tutorials

The projects of the tutorials of the reference (`examples/Docs`, section Tutorials). Each folder is a project of its own: copy it out, `npm install`, `npm run dev`.

| Project | Tutorial | What it shows |
| --- | --- | --- |
| `Landing` | A landing page | Components, lists, PlanPicker, a Form, toasts, one HTML file (`Single: true`) |
| `Blog` | A blog | The router, a Service that loads Markdown, the storage of the browser |
| `Admin` | An admin panel | A guard, a session, Table, Chart, Drawer, dialogs |
| `Shop` | A shop | A cart shared by the pages, a component for each item, a checkout with card fields |
| `Collection` | A media collection | MediaHero, MediaShelf, MediaCard, FacetFilter, TrackList, CastList, the parameters of a route |
| `Chat` | A chat | The Chat layout, Messaging between tabs, a bot |
| `Game` | A browser game | GameWorld, a HUD, GameMenu, achievements |
| `Editor` | An editor in the manner of an IDE | Workspace, Tree, Tabs, CodeEditor, Terminal, CommandPalette |
| `Backend` | Elemenx on the pages of a server | No build: a part of a page rendered by a server |
| `Signup` | Forms and validation | A model of a form in code, async and group validators, a list of fields, the errors of a server |
| `Dashboard` | A live dashboard | Server-sent events, a Protocol, resuming a stream, a Chart that moves |
| `Telemetry` | A board of live telemetry | A WebSocket of up to 120 packets a second, the state changed once a frame, fixed buffers, a theme for each scene |
| `Notes` | Working offline: sync | IndexedDB, an outbox, sync when online, conflicts |
| `Auth` | Signing in | JWT, a refresh cookie with rotation, a guard that waits, a token renewed on 401 |
| `Languages` | An application in several languages | Dictionaries, plural forms, Intl, right to left |
| `Extension` | A browser extension | `--extension`, `chrome.storage`, a stand-in for development |
| `Call` | A video call | WebSocket signaling, WebRTC, CallStage |
| `Kit` | A library of your own | A library with a service, phrases, tokens and `$Meta`, and its showcase |
| `Todo` | Testing an application | Unit tests of a Service (Vitest), end-to-end tests (Playwright) |

The tutorials of widgets, of a PWA and of the native programs use `examples/Widgets`, `examples/PWA` and `examples/Native`.

From the repository: `npm run tutorial -- Blog` (the name in any case; `npm run tutorial` lists the projects and their ports), or `node elemenx-cli.js dev examples/Tutorials/Blog`. `tests/examples/tutorials.spec.js` builds each project and walks its tutorial in a browser.
