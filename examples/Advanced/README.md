# Elemenx application example

This directory can be copied as a standalone project. It contains neither a copy of `elemenx.js` nor a private copy of the development server.

After copying the directory:

```bash
npm install
npm run dev
```

The installed `elemenx` package provides the shared `tools/server.js` and the framework exposed by that server as `/elemenx.js`.

Components keep source and markup together:

```text
components/
  index.js
  layout/
    Layout.js
    layout.html
  home/
    HomePage.js
    home.html
  project/
    ProjectPage.js
    project.html
```

`components/index.js` is the Elemenx Discovery enumerator. `Application.Root` points to `components`, so component scripts do not have to be listed manually in `index.html`.

A component uses a template path local to its own definition script, for example `TemplateURL: 'project.html'`. Elemenx resolves that relative URL from the component script URL.
The Home page also demonstrates structural composition. Component tags without projected children may use XML-style self-closing syntax such as `<ProjectCard />`. `*for` supports keyed collections as well as classic local-counter iteration. A counter can also assign an item expression on each iteration:

```html
<div *for="i = 0; item = QueueItem(i); i++">
	<IteratorBadge [item]="item" [index]="i" />
</div>
```

The initializer creates loop-local variables, the condition is checked before each render, and the update expression runs after each iteration. In the example above `item = QueueItem(i)` is the loop condition, so rendering stops when it becomes falsy. Elemenx aborts a runaway structural loop after 10,000 iterations.

For direct numeric iteration the condition can be a normal comparison:

```html
<span *for="i = 0; i < 5; i++">Iteration {{i}}</span>
```

The initializer creates `i` in the loop-local scope, the condition is checked before each render, and the update expression runs after each iteration. The same 10,000-iteration runaway protection applies.

The Advanced application also registers custom behavioral directives through the application discovery tree:

```js
Elemenx.Directive('highlight', {
	ElemenxOnCreate: function (context) {
		context.Data.ClassName = 'directive-highlighted';
	},

	ElemenxOnUpdate: function (context) {
		context.Element.classList.toggle(context.Data.ClassName, !!context.Value);
	},

	ElemenxOnDestroy: function (context) {
		context.Element.classList.remove(context.Data.ClassName);
	}
});
```

The Home page demonstrates both a reactive `*highlight="DirectiveHighlighted"` directive and a reactive `*tooltip="DirectiveTooltip"` directive. The tooltip creates and owns a real floating DOM element, reacts to its expression value, supports mouse and keyboard focus, and removes its listeners and DOM node during directive destruction. The examples intentionally use `context.Data` and the Create/Update/Destroy lifecycle so the Advanced project acts as a visible feature showcase rather than only a minimal syntax sample.

The Home page also includes a real Network showcase. `Elemenx.Network.XHR` requests `/data/network-showcase.json` and displays the transport lifecycle (`BeforeRequest`, `BeforeResponse`, `AfterResponse`, `Success`) together with the decoded demo response. The data file lives outside the Application graph so the production Builder copies it as a public asset and the same showcase runs in both development and production builds.