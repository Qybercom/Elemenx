# Elemenx application example

This directory can be copied as a standalone project. It contains neither a copy of `elemenx.js` nor a private copy of the development server.

After copying the directory:

```bash
npm install
npm start
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
The Home page also demonstrates structural composition. Component tags without projected children may use XML-style self-closing syntax such as `<ProjectCard />`. `*for` remains the keyed collection primitive, while `*for` performs in-place iteration from an arbitrary expression:

```html
<div *for="item = QueueItem($index)">
	<IteratorBadge item="{{item}}" index="{{$index}}" />
</div>
```

The expression is evaluated with `$index` starting at `0`. Its value is assigned to the local name on the left side and rendering stops when the expression returns a falsy value. Elemenx aborts a runaway structural loop after 10,000 iterations.

`*for` also supports a local counter form when direct numeric iteration is clearer:

```html
<span *for="i = 0; i < 5; i++">Iteration {{i}}</span>
```

The initializer creates `i` in the loop-local scope, the condition is checked before each render, and the update expression runs after each iteration. The same 10,000-iteration runaway protection applies.