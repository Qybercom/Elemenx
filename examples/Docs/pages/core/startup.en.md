# From a script to the first screen

A page loads `elemenx.js`, then the `app.js` of your project, and a moment later shows a working application. Here is what happens in that moment, step by step.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 236" role="img" aria-label="From a script to the first screen">
	<title>From a script to the first screen</title>
	<rect class="box" x="20" y="20" width="168" height="64" rx="8" />
	<text x="104" y="47.5" text-anchor="middle" class="strong">1  elemenx.js</text>
	<text x="104" y="65.5" text-anchor="middle" class="muted">the framework loads</text>
	<rect class="box" x="204" y="20" width="168" height="64" rx="8" />
	<text x="288" y="47.5" text-anchor="middle" class="strong">2  app.js</text>
	<text x="288" y="65.5" text-anchor="middle" class="muted">Elemenx.Application</text>
	<rect class="box" x="388" y="20" width="168" height="64" rx="8" />
	<text x="472" y="47.5" text-anchor="middle" class="strong">3  Libraries, language</text>
	<text x="472" y="65.5" text-anchor="middle" class="muted">$Use, $Locales</text>
	<rect class="box" x="572" y="20" width="168" height="64" rx="8" />
	<text x="656" y="47.5" text-anchor="middle" class="strong">4  The graph</text>
	<text x="656" y="65.5" text-anchor="middle" class="muted">a bundle, or index.js</text>
	<rect class="box" x="572" y="150" width="168" height="64" rx="8" />
	<text x="656" y="177.5" text-anchor="middle" class="strong">5  Directives, Services</text>
	<text x="656" y="195.5" text-anchor="middle" class="muted">loaded before the root</text>
	<rect class="box" x="388" y="150" width="168" height="64" rx="8" />
	<text x="472" y="177.5" text-anchor="middle" class="strong">6  The root component</text>
	<text x="472" y="195.5" text-anchor="middle" class="muted">$Component, built</text>
	<rect class="box" x="204" y="150" width="168" height="64" rx="8" />
	<text x="288" y="177.5" text-anchor="middle" class="strong">7  Mounted</text>
	<text x="288" y="195.5" text-anchor="middle" class="muted">$Mount, then $OnReady</text>
	<rect class="box accent" x="20" y="150" width="168" height="64" rx="8" />
	<text x="104" y="177.5" text-anchor="middle" class="strong">8  Router starts</text>
	<text x="104" y="195.5" text-anchor="middle" class="muted">the page of the URL</text>
	<polyline class="line" points="188,52 204,52" />
	<polygon class="head" points="204,52 195.0,47.5 195.0,56.5" />
	<polyline class="line" points="372,52 388,52" />
	<polygon class="head" points="388,52 379.0,47.5 379.0,56.5" />
	<polyline class="line" points="556,52 572,52" />
	<polygon class="head" points="572,52 563.0,47.5 563.0,56.5" />
	<polyline class="line" points="656,84 656,150" />
	<polygon class="head" points="656,150 660.5,141.0 651.5,141.0" />
	<polyline class="line" points="572,182 556,182" />
	<polygon class="head" points="556,182 565.0,186.5 565.0,177.5" />
	<polyline class="line" points="388,182 372,182" />
	<polygon class="head" points="372,182 381.0,186.5 381.0,177.5" />
	<polyline class="line" points="204,182 188,182" />
	<polygon class="head" points="188,182 197.0,186.5 197.0,177.5" />
</svg>
```

## 1. The framework loads

`elemenx.js` runs once and defines `Elemenx`: the functions you call (`Elemenx.Application`, `Elemenx.Component`, `Elemenx.Service`...) and, hidden behind them, its parts. Nothing is drawn yet. If the page already has a copy of the same version, the second one stops at once; another version starts beside it, and the console says so.

## 2. An Application is declared

```js
Elemenx.Application('Shop', {
	$Component: 'Layout',
	$Root: 'Shop',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']},
	$Router: {Routes: [...]}
});
```

`Elemenx.Application` only records the definition and waits for the page to be ready. An Application is the owner of everything that follows: its services are its own, its router belongs to it, and two Applications on one page do not see each other's state.

## 3. Libraries and the language

The Application names its libraries (`$Use`): their files will be found and their stylesheets attached. Then it picks a language (the one chosen before, the one of the system, or the `lang` of the page) and loads its dictionaries, its own and those of its libraries. The first screen waits for them, so it shows phrases, never keys.

## 4. The graph: a bundle, or the files

The Application now needs the definitions of its components, services and directives. There are two ways to get them, and Elemenx tries them in this order:

- **A bundle.** A build put every definition in `app.js` inside `Elemenx.Bundle({...})`. They are registered without a single request.
- **Discovery.** In development there is no bundle. `$Root: 'Shop'` names a folder; its `index.js` lists files and folders (`['services', 'Layout/Layout.js']`), each folder has its own `index.js`, and Discovery reads them all to make a map: which name is in which file. The files themselves are not loaded yet.

## 5. Directives and services before the root

A template can only be compiled when its directives are known, and a component may ask for a service in its first line. So the directives and services of the Application and its libraries are loaded (from the bundle, or by a `<script>` each) before the root component is made. Services are only loaded here, not created: a service is created the first time someone asks for it.

## 6. The root component

The component named by `$Component` is built: its template compiled, its state made reactive, its `$OnCreate` run (see [From a template to the page](/core/templates)). Its template names other components (`<Header>`, `<ProductList>`); each is built the same way, down the tree. In development, a component whose file is not loaded yet gets a placeholder; Discovery loads the file, and the component takes its place as soon as it is there.

## 7. Mounted

The root goes into the element of `$Mount` (or into a shadow root of it, with `$Shadow`). Every component that is now in the page runs `$OnReady`; the Application runs its own `$OnReady`. The splash of the page, if there is one, fades out.

## 8. The router starts

Last, the router reads the URL, finds its route, runs its guards and renders its page into the outlet (see [How a navigation happens](/core/router)). From now on the application lives: events change state, state changes the page.

## When something fails

A step that fails (a file that does not load, a component that throws in its `$OnCreate`) stops that Application, not the page: it shows its `$Error` (a template you give), calls `$OnError`, and writes the reason in the console. Another Application of the same page goes on.
