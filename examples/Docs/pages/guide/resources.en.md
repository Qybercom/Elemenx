# Resources and bundles

In development, Elemenx loads the files of an Application one by one, when they are first needed. A production build carries them inside its scripts instead. Three registries make that work, and they are open to an Application too: embedded files (`Elemenx.Resource`), bundled entities (`Elemenx.Bundle`) and precompiled expressions (`Elemenx.Expressions`).

## Embedded files

`Elemenx.Resource` keeps the text of a file under its URL, so code that would fetch it finds it already there: the sprites of the icons, the data of a library, a dictionary.

| Call | Meaning |
| --- | --- |
| `Elemenx.Resource(url, text)` | embeds a text under a URL (resolved against the page) |
| `Elemenx.Resource(url)` | the embedded text, or `null` |
| `Elemenx.Resource.Load(url, callback)` | calls back `(error, text)`: the embedded text at once, or the text fetched from the URL |

A component or a service that reads a file through `Resource.Load` works the same in development, from a server, and in a build in one file that runs from `file://`, where nothing can be fetched.

```js
Elemenx.Resource.Load('/data/countries.json', function (error, text) {
	if (error) return;

	self.Countries = JSON.parse(text);
});
```

## The bundle

`Elemenx.Bundle({Type: {Name: loader}})` registers entities a build carries: a loader is a function that declares the entity (`Elemenx.Component(...)`, `Elemenx.Service(...)`, a guard, a directive) the first time it is needed. A production `app.js` begins with one call of it for the whole graph, its templates and styles inlined:

```js
Elemenx.Bundle({
	Component: {
		HomePage: function () {
			Elemenx.Component('HomePage', {$Template: '<main>...</main>', $Style: '.home { ... }'});
		}
	},
	Service: {
		Cart: function () {
			Elemenx.Service('Cart', {...});
		}
	}
});
```

The bundle is asked first, Discovery (the files of the graph) after: an Application can mix bundled entities and ones it still loads from files. Two bundled graphs may not declare the same name of the same type; the builder stops and says so.

## Precompiled expressions

A page whose Content Security Policy forbids `eval` (a browser extension, `script-src 'self'`) cannot compile the expressions of its templates. `elemenx build --precompile` writes them as code into the build: one `Elemenx.Expressions({source: function ($globals, $scope) {...}})` call with a function for each expression the builder found in the templates. The compiler takes them and compiles nothing; an expression missing there throws `Elemenx expression is not precompiled and the page forbids eval: <source>` (a template made at run time cannot be read by the builder). See [Builds](/guide/build).

## The framework itself

| Member | Meaning |
| --- | --- |
| `Elemenx.Version` | the version of this copy |
| `Elemenx.NoConflict()` | gives the name `Elemenx` back to what had it before this copy, and returns the copy |
| `Elemenx.RuntimeID()` | the identifier of this runtime (a tab, a frame, a worker): `runtime-…` |
| `Elemenx.StartedAt()` | when this copy started |
| `Elemenx.Title(text)` | sets the title of the document; `Elemenx.Title()` returns it |

Each copy of `elemenx.js` has a namespace of its own. A second copy of the same version leaves the first in place and does nothing; a copy of another version starts, but the window keeps the first `Elemenx` (the page it serves goes on working) and the console warns. An isolated build (`elemenx build --widget`) keeps its copy to itself: the page may have an `Elemenx` of any version.

## Example

A text embedded by the example, read by `Resource.Load` with no request, and a file of this reference read from the server:

```example
<Button Label="Read both" Variant="primary" (click)="Read" />
<Properties>
	<Property Label="Embedded" [value]="Embedded" />
	<Property Label="Fetched (/pages/index.json)" [value]="Fetched" />
	<Property Label="The framework" [value]="Version" />
	<Property Label="This runtime" [value]="Runtime" />
</Properties>
<script>
({
	Embedded: '—',
	Fetched: '—',
	Version: Elemenx.Version,
	Runtime: Elemenx.RuntimeID(),

	$OnCreate: function () {
		Elemenx.Resource('/docs-example/greeting.txt', 'Hello from an embedded file');
	},

	Read: function () {
		var self = this;

		Elemenx.Resource.Load('/docs-example/greeting.txt', function (error, text) {
			self.Embedded = error ? error.message : text;
		});

		Elemenx.Resource.Load('/pages/index.json', function (error, text) {
			self.Fetched = error ? error.message : JSON.parse(text).Sections.length + ' sections, ' + text.length + ' characters';
		});
	}
})
</script>
```
