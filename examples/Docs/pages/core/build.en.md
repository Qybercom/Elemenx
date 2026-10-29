# What a build does

In development the browser loads your files one by one, as they are. That is quick to start and easy to debug, and slow for a visitor: dozens of requests, and every component of every library listed. `elemenx build` makes the same application small and fast, without changing how it works.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 290" role="img" aria-label="What a build does">
	<title>What a build does</title>
	<rect class="box soft" x="20" y="20" width="160" height="78" rx="8" />
	<text x="100" y="45.5" text-anchor="middle" class="strong">Your project</text>
	<text x="100" y="63.5" text-anchor="middle" class="muted">app.js, index.html</text>
	<text x="100" y="81.5" text-anchor="middle" class="muted">components, libraries</text>
	<rect class="box" x="212" y="20" width="168" height="78" rx="8" />
	<text x="296" y="45.5" text-anchor="middle" class="strong">Read the graph</text>
	<text x="296" y="63.5" text-anchor="middle" class="muted">tags → components</text>
	<text x="296" y="81.5" text-anchor="middle" class="muted">names → services</text>
	<rect class="box" x="412" y="20" width="168" height="78" rx="8" />
	<text x="496" y="45.5" text-anchor="middle" class="strong">Trim and pack</text>
	<text x="496" y="63.5" text-anchor="middle" class="muted">leave out the unused</text>
	<text x="496" y="81.5" text-anchor="middle" class="muted">inline, minify</text>
	<rect class="box accent" x="612" y="20" width="128" height="78" rx="8" />
	<text x="676" y="45.5" text-anchor="middle" class="strong">dist/</text>
	<text x="676" y="63.5" text-anchor="middle" class="muted">index.html</text>
	<text x="676" y="81.5" text-anchor="middle" class="muted">elemenx.js, app.js</text>
	<polyline class="line" points="180,59 212,59" />
	<polygon class="head" points="212,59 203.0,54.5 203.0,63.5" />
	<polyline class="line" points="380,59 412,59" />
	<polygon class="head" points="412,59 403.0,54.5 403.0,63.5" />
	<polyline class="line" points="580,59 612,59" />
	<polygon class="head" points="612,59 603.0,54.5 603.0,63.5" />
	<rect class="box" x="80" y="176" width="260" height="52" rx="8" />
	<text x="210" y="206.5" text-anchor="middle" class="strong">A component is asked for</text>
	<rect class="box accent" x="420" y="140" width="300" height="52" rx="8" />
	<text x="570" y="161.5" text-anchor="middle" class="strong">In Elemenx.Bundle</text>
	<text x="570" y="179.5" text-anchor="middle" class="muted">registered: no request</text>
	<rect class="box soft" x="420" y="212" width="300" height="52" rx="8" />
	<text x="570" y="233.5" text-anchor="middle" class="strong">Not there</text>
	<text x="570" y="251.5" text-anchor="middle" class="muted">Discovery loads its file</text>
	<polyline class="line" points="340,196 420,166" />
	<polygon class="head" points="420,166 410.0,164.9 413.2,173.4" />
	<polyline class="line" points="340,208 420,238" />
	<polygon class="head" points="420,238 413.2,230.6 410.0,239.1" />
</svg>
```

## 1. It reads the graph

The builder starts where the browser would: `index.html` and `app.js`. It reads the Application (`$Component`, `$Root`, `$Use`, `$Router`), then follows the graph as the page would run it:

- **Tags lead to components.** The template of the root names `<Header>` and `<ProductList>`; their templates name others; and so on. Routes name the components of the pages.
- **Names lead to services, guards and directives.** `$Service('Cart')`, `Guards: ['SignedIn']`, `*tooltip` in a template: each is a definition to keep, and its own code names more.
- **Uses lead to the parts of the framework.** `$Router` keeps the Router; `$Network` the Network; `$Messaging` the Messaging; and so on.

A name built at run time (`$Service(name)`) cannot be followed: name it in quotes somewhere, or build with `--full`.

## 2. It trims and packs

What the graph did not reach is left out: the components of a library the Application never shows, the services it never asks for, the parts of the framework it never calls (the Router, the Network, the workers...), the packs of a library it does not use (emoji, cities, icon sets), and the phrases of the dictionaries no code names. The build prints what it left out.

What stays is packed:

- templates (`$TemplateURL`) and styles (`$StyleURL`) are put inside their definitions, so no file is requested for them;
- the code, the templates and the styles are minified;
- `$Meta` is dropped, unless the Application reads it (`Elemenx.Meta`, the Designer);
- with `--precompile` (always for extensions and native programs), the expressions of the templates are written as functions, for pages that forbid `eval`.
- a site and a widget are split by their routes: what one route alone needs goes into a part of its own (`dist/parts/`), fetched when the route is first shown (`--no-split` keeps one bundle).

## 3. It writes `dist/`

`dist/` holds `index.html`, `elemenx.js` (only its parts the Application uses), `app.js` (every definition inside `Elemenx.Bundle({...})`, followed by your `app.js`), the files of the libraries the Application needs, and the public files of the project. Other builds take the same graph to other places: one HTML file (`--single`), an isolated widget (`--widget`), a browser extension (`--extension`), native programs (`--native`).

## 4. In the page: bundle first, Discovery second

When the built page runs, every definition is already in `Elemenx.Bundle`: when a component is needed, it is taken from there, without a request. Discovery (the loading of files by `index.js`) is still there as a fallback: an Application whose bundle lacks a component, in a page that has its sources, still finds it. That is what makes a build an optimization, not a different program: the same code runs in development and in production, and a build that left out too much fails loudly in development of the build (`elemenx serve`), where you test it before it goes.

## What it does not do

The builder does not rename your files with hashes, does not split the bundle into chunks, and does not transpile: the code is ES5, so it runs as it is. Cache the files with revalidation (see [Putting it online](/tutorials/deploy)).
