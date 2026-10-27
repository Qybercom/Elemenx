# The big picture

This section explains how Elemenx works inside: what happens between a `<script>` tag and a page that answers clicks. You do not need it to build applications; it helps when something surprises you, when you want to know what a feature costs, or when you simply like to know. Each page is short and starts from a picture.

## One file, many parts

Elemenx is one JavaScript file, `elemenx.js`, with no dependencies, written in ES5 so it runs anywhere a browser runs. Inside, it is a set of parts that each do one thing and talk to each other through one private object:

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 332" role="img" aria-label="How Elemenx is layered">
	<title>How Elemenx is layered</title>
	<rect class="box accent" x="20" y="20" width="540" height="56" rx="8" />
	<text x="290" y="43.5" text-anchor="middle" class="strong">Your Application</text>
	<text x="290" y="61.5" text-anchor="middle" class="muted">components · services · routes · templates</text>
	<rect class="box" x="20" y="96" width="540" height="72" rx="8" />
	<text x="290" y="127.5" text-anchor="middle" class="strong">The core of Elemenx</text>
	<text x="290" y="145.5" text-anchor="middle" class="muted">Application · Component · Template · Reactive · Router · Cache</text>
	<rect class="box" x="20" y="188" width="540" height="56" rx="8" />
	<text x="290" y="211.5" text-anchor="middle" class="strong">Services of the framework</text>
	<text x="290" y="229.5" text-anchor="middle" class="muted">Network · Storage · Events · Messaging · Workers · Locale</text>
	<rect class="box soft" x="20" y="264" width="540" height="48" rx="8" />
	<text x="290" y="283.5" text-anchor="middle" class="strong">The browser</text>
	<text x="290" y="301.5" text-anchor="middle" class="muted">DOM · fetch · storage · history · WebRTC</text>
	<rect class="box" x="580" y="20" width="160" height="148" rx="8" />
	<text x="660" y="80.5" text-anchor="middle" class="strong">Libraries</text>
	<text x="660" y="98.5" text-anchor="middle" class="muted">ElemenxUI</text>
	<text x="660" y="116.5" text-anchor="middle" class="muted">your own</text>
	<polyline class="line" points="290,76 290,96" />
	<polygon class="head" points="290,96 294.5,87.0 285.5,87.0" />
	<polyline class="line" points="290,168 290,188" />
	<polygon class="head" points="290,188 294.5,179.0 285.5,179.0" />
	<polyline class="line" points="290,244 290,264" />
	<polygon class="head" points="290,264 294.5,255.0 285.5,255.0" />
	<polyline class="line" points="580,94 560,94" />
	<polygon class="head" points="560,94 569.0,98.5 569.0,89.5" />
</svg>
```

- **Your Application** is what you write: components (a template, a style, some state and methods), services (shared logic), routes and guards.
- **The core** turns that into a living page: it starts Applications, compiles templates, keeps the state reactive, renders components, and moves between pages.
- **The services of the framework** give the core and your code the rest of the browser in one shape: the network, storages, events between parts of the page, messages between tabs and workers, languages.
- **The browser** does the real work: the DOM, `fetch`, `localStorage`, history. Elemenx adds no layer between your page and the DOM: what you see in the developer tools is what Elemenx made, element for element.
- **Libraries** (ElemenxUI, or your own) are components, services and directives an Application uses, loaded as if they were its own.

## The ideas behind it

**HTML is the template language.** A template is HTML with a few marks: `{{ }}` for text, `[x]` for a value, `(x)` for an event, `*x` for a directive. A designer can read it; a browser parses it.

**State is plain objects.** A component's state is its fields; assigning one updates the page. There is no `setState`, no store to subscribe to, no immutable copies.

**Fine-grained updates.** Each `{{ }}` and each `[x]` of a template is tied to the exact data it reads. When that data changes, that one text node or attribute is updated, and nothing else is computed or compared. There is no virtual DOM.

**Callbacks and events, never Promises in the API.** Anything that takes time (a request, a guard, a loader) calls you back or emits an event. It works the same in every browser and is easy to cancel and to follow.

**Development without a build.** In development the browser loads your files as they are, following `index.js` lists. A build is an optimization for production, not a requirement to run.

## The pages of this section

- [From a script to the first screen](/core/startup): how an Application starts.
- [From a template to the page](/core/templates): how a template becomes DOM.
- [How state updates the page](/core/reactivity): the reactive system.
- [The life of a component](/core/components): creation, props, events, content, sleep and destruction.
- [Services, events and messages](/core/services): what components share, and how parts of an application talk.
- [How a navigation happens](/core/router): the router, step by step.
- [Network and storage](/core/network): resources, protocols, ownership.
- [What a build does](/core/build): from a project to `dist/`.
