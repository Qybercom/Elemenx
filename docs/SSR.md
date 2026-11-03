# Pages rendered on a server (SSR)

A page of an Elemenx Application can come from the server already rendered: a search engine reads its content, a browser shows it before the scripts run, and the Application takes its place once it is ready, with the data the server loaded, without loading them again.

## The contract

Any server may write a page so, in any language.

- The mount of an Application holds the markup of its root, and has `data-elemenx-ssr` (the version of the framework that rendered it; any value marks it).
- The page has `<script type="application/json" data-elemenx-state>` with `{Version: 1, URL, Components: {key: fields}}`. Its `<` are written `<`, so its data cannot end the script.
- The key of a Component is its place in the tree of Components: the key of its owner, its name, and how many of that name its owner made before it, `Shell#0/Card#2`. A Component a Router shows is at the root of that tree (`Items#0`); one of a template URL takes the name of the Component that loaded it.
- The fields of a key are given to that Component after its `$OnCreate` and before its first render. A key comes once: a Component made again (a page of the Router shown again) is the next of its name (`Items#1`), and loads its own data.

## Data: $OnSSR

```js
Elemenx.Component('Items', {
	$TemplateURL: 'Items.html',
	Items: [],

	$OnSSR: function (done, context) {
		var self = this;

		this.$Network('api').Get('/items', function (error, items) {
			self.Items = items || [];

			done(error);
		});
	}
});
```

`$OnSSR(done, context)` loads the data of a Component: `context` is `{Server, Key, URL}`, and `done(error)` says it has them.

- On the server the page waits for every `done`. The fields of each such Component go into the state: its own values that JSON keeps, without its methods and its `$` and `_` names.
- On the client a Component whose key is in the state starts with those fields, and `$OnSSR` is not called.
- In a page that no server rendered, or for a Component that was not there, `$OnSSR` runs on the client. The same code loads the data in both places.

## On the client

An Application over the markup of a server makes its root out of sight beside it. It puts the root in its place at once, when it is ready: with a `$Router`, once the page of its first navigation is there. The page is never empty between them.

`$Hydrate: true` of the Application carries over what the reader did in that markup before the scripts ran:

- what was typed and chosen (the fields of the markup by their order; the root hears an `input` or a `change` for each changed one, so its bindings follow);
- the `<details>` opened;
- the scroll of each part;
- the focus.

The nodes of the root are its own, made by the framework, not the nodes of the server.

## Rendering in Node

`tools/ssr.js` renders a page of a project in Node. The page runs in a document of its own (`tools/dom.js`), its scripts and the files they ask for are read from the project as the development server gives them, and `Elemenx.Render` of the page gives the HTML.

```js
var SSR = require('@qybercom/elemenx/tools/ssr.js');

SSR.Render({Root: __dirname, URL: request.url}, function (error, html, state) {
	if (error) {
		response.writeHead(500);
		response.end(error.message);

		return;
	}

	response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
	response.end(html);
});
```

The options of `Render`:

| Option | What it is |
|---|---|
| `Root` | The folder of the project, or of its build. |
| `URL` | The path of the page, with its query (`/` by default). |
| `Page` | The file of the page in `Root` (`index.html`). |
| `HTML` | The text of the page, in place of its file. |
| `Base` | The address the site is served from (`/ui/`). |
| `Framework` | The `elemenx.js` (the one of the package by default). |
| `Language` | The language of the browser it plays. |
| `Timeout` | How long a page may take (15000 milliseconds). |
| `Files(url)` | The text of a file of an address it answers itself, or `null`. |

What the page throws or reports, or an Application that fails, fails the render. Each render runs in a context of its own: nothing of one is left for the next. The document answers as a page that is not shown: its sizes are 0 and the observers never call back, so what a Component measures comes on the client.

`Elemenx.Render(callback)` is the part of the page: in a page rendered for a server (`ElemenxSSR`, an object, set before the framework runs), it waits until every Application has its page and no `$OnSSR` is pending. Then it leaves out the scripts the framework loaded itself (`data-elemenx-loaded`), marks the mounts, adds the state and calls back `(error, html, state)`.

## Prerendering a site

`elemenx build --prerender` (or `Prerender` of `elemenx.config.js`) renders each page of the built site, as a file of its own (`tools/prerender.js`).

- It starts at the root of the site, or at the paths given (`--prerender /,/about`, `Prerender: ['/', '/about']`), and follows the links of each page it renders. A link is followed when it is of the same site and not of a file (`<a href="/items">`). `Prerender: {Routes, Crawl: false, Limit}` follows none, or at most `Limit` pages (200).
- `/` is written as `index.html`, `/items` as `items.html`.
- The server of Elemenx (`elemenx serve`) and the image of `--docker` send `items.html` for `/items`. Another server needs the same rule: `try_files $uri $uri.html $uri/ /index.html` of nginx.
- A page that fails is told, and fails the build after the others.
