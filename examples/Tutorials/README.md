# Tutorials

The projects of the tutorials of the reference (`examples/Docs`, section Tutorials). Each folder is a project of its own: copy it out, `npm install`, `npm run dev`.

| Project | Tutorial | What it shows |
| --- | --- | --- |
| `Landing` | A landing page | Components, lists, PlanPicker, a Form, toasts, one HTML file (`Single: true`) |
| `Blog` | A blog | The router, a Service that loads Markdown, the storage of the browser |
| `Admin` | An admin panel | A guard, a session, Table, Chart, Drawer, dialogs |
| `Shop` | A shop | A cart shared by the pages, a component for each item, a checkout with card fields |
| `Chat` | A chat | The Chat layout, Messaging between tabs, a bot |
| `Game` | A browser game | GameWorld, a HUD, GameMenu, achievements |
| `Editor` | An editor in the manner of an IDE | Workspace, Tree, Tabs, CodeEditor, Terminal, CommandPalette |
| `Backend` | Elemenx on the pages of a server | No build: a part of a page rendered by a server |

The tutorials of widgets, of a PWA and of the native programs use `examples/Widgets`, `examples/PWA` and `examples/Native`.

From the repository: `node elemenx-cli.js dev examples/Tutorials/Blog`. `tests/examples/tutorials.spec.js` builds each project and walks its tutorial in a browser.
