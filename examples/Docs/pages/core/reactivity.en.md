# How state updates the page

You write `this.Total = 42`, and the number on the page changes. No call to render, no subscription. This page shows how.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 290" role="img" aria-label="The cycle of reactivity">
	<title>The cycle of reactivity</title>
	<rect class="box accent" x="20" y="20" width="330" height="60" rx="8" />
	<text x="185" y="45.5" text-anchor="middle" class="strong">1  An effect runs</text>
	<text x="185" y="63.5" text-anchor="middle" class="muted">{{ Total }} reads state.Total</text>
	<rect class="box" x="410" y="20" width="330" height="60" rx="8" />
	<text x="575" y="45.5" text-anchor="middle" class="strong">2  The proxy tracks the read</text>
	<text x="575" y="63.5" text-anchor="middle" class="muted">Total → this effect</text>
	<rect class="box" x="410" y="150" width="330" height="60" rx="8" />
	<text x="575" y="175.5" text-anchor="middle" class="strong">3  Code writes</text>
	<text x="575" y="193.5" text-anchor="middle" class="muted">this.Total = 42</text>
	<rect class="box" x="20" y="150" width="330" height="60" rx="8" />
	<text x="185" y="175.5" text-anchor="middle" class="strong">4  The proxy triggers</text>
	<text x="185" y="193.5" text-anchor="middle" class="muted">the effects of Total run again</text>
	<polyline class="line" points="350,50 410,50" />
	<polygon class="head" points="410,50 401.0,45.5 401.0,54.5" />
	<polyline class="line" points="575,80 575,150" />
	<polygon class="head" points="575,150 579.5,141.0 570.5,141.0" />
	<polyline class="line" points="410,180 350,180" />
	<polygon class="head" points="350,180 359.0,184.5 359.0,175.5" />
	<polyline class="line" points="185,150 185,80" />
	<polygon class="head" points="185,80 180.5,89.0 189.5,89.0" />
	<text x="380" y="248" text-anchor="middle" class="muted">One binding, one effect: only the text node of Total changes. No virtual DOM, nothing compared.</text>
	<text x="380" y="270" text-anchor="middle" class="muted">$Batch(...) holds the effects, and runs each once at its end.</text>
</svg>
```

## The state is behind a proxy

When a component is made, its state (the fields of its definition, copied for this instance) is wrapped in a JavaScript `Proxy`. A proxy looks and behaves like the object, but it sees every read and every write. Objects and lists inside the state are wrapped too, the first time they are reached, at any depth.

Only plain objects (`{}`) and arrays are wrapped. A `Date`, a `Map`, an element of the page, an instance of a class are kept as they are: Elemenx does not know what their methods change. To update what shows them, assign a new one (`this.Since = new Date()`).

## Reading is tracked

An **effect** is a function Elemenx runs and watches: every binding of a template is one (see [From a template to the page](/core/templates)). While an effect runs, the proxy notes each field it reads in a table: for this object and this key, these effects depend on it. `{{Total}}` reads `Total`, so the effect of that text node is noted under `Total`.

The notes are made fresh at each run: an effect that read `Discount` only when `Member` was true depends on `Discount` only while it is. So an effect never runs for data it no longer reads.

## Writing triggers

When code writes `this.Total = 42`, the proxy looks up `Total` in the table and runs its effects again, at once, before the assignment returns. Each writes its one node. Writing the same value again does nothing. Adding a key, deleting one, or changing the length of a list triggers the effects that iterate over it (a `*for`, `Object.keys`).

The update is **synchronous**: the line after the assignment already sees the new DOM. There is no queue to wait for and no `nextTick`.

## Several changes, one update

Five assignments run the effects that depend on them five times. When a response of the server sets several fields, batch them:

```js
this.$Batch(function (state) {
	state.Loading = false;
	state.Items = response.Items;
	state.Total = response.Total;
});
```

Inside `$Batch` the effects are collected instead of run; at the end each one runs once. `this.$Update({...})` does the same for a set of fields. A method of a list (`push`, `splice`, `sort`) is already one change, however many items it moves.

## What reacts, and what does not

- **Fields of a component**, and anything plain inside them: yes.
- **Services** are plain JavaScript objects, not reactive: a component copies what it shows from a service when the service tells it (`OnChange`), as the tutorials do. This keeps the cost of reactivity where the page is, not in every object of the application.
- **Hooks** (`$OnCreate`, `$OnReady`, `$OnDestroy`...) run untracked: what they read does not make them run again.
- **Helpers** called from a template (`{{Visible(Items, Filter)}}`) are part of the effect that calls them: they run again when what they read changes. A helper must only compute; one that writes a field the template reads makes the effect run again forever.

## Why no virtual DOM

A virtual DOM builds a description of the whole component at each change and compares it with the last one to find what to update. Fine-grained effects know what to update without comparing: the table of dependencies already says which nodes read the data that changed. The cost is a little memory for the table, paid once per binding; the gain is that an update costs what changed, not what is on the page.
