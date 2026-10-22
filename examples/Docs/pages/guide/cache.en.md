# Lazy rendering and cache

Two tools keep a large Application fast: `*lazy` builds the parts of a long page only when they come near the screen, and `Elemenx.Cache` keeps components that leave the page asleep instead of destroying them (keep-alive), and unloads the definitions nobody uses.

## *lazy

```html
<Section Title="Sales" *lazy="320">
	<Chart [data]="Sales" />
</Section>

<Table *lazy="'#table-skeleton'" [rows]="Orders" />
```

The host of `*lazy` (an element or a component) renders when it comes within a screen of the viewport, or when the browser is idle, whichever is first, one host at a time in the order of the page; once rendered, it stays. A long page shows its first screen at once and builds the rest in the background, instead of freezing the tab until all of it is built.

Meanwhile a placeholder holds its place (`[data-elemenx-lazy]`):

- no value: a line high;
- a number or a length: that height (`*lazy="320"` pixels, `*lazy="'20rem'"`); ElemenxUI draws it as a shimmer (`data-elemenx-lazy="sized"`);
- `'#id'`: the markup of a template of the page or of the registry (`data-elemenx-lazy="template"`), as a skeleton of the content.

What the host declares exists only once it renders: its hotkeys, listeners and services start then. A list of them follows their changes (`Hotkeys.OnChange` of ElemenxUI) rather than reading them once. A host whose component goes before its turn never renders.

## The cache

Everything is off by default: a component that leaves is destroyed, a definition stays loaded. `Elemenx.Cache(policy)` sets the policy; `Elemenx.Cache()` returns it. A key that is not given keeps its value; ages are milliseconds, `0` means no limit.

```js
Elemenx.Cache({
	Definitions: {MaxAge: 600000, Max: 200},
	Instances: {Scope: 'router', MaxAge: 300000, Max: 20}
});
```

### Instances: keep-alive

An instance that leaves its place sleeps out of the page and wakes as it was, its DOM, its state and its scroll, when its place shows it again. `Scope` says which:

| Scope | What sleeps |
| --- | --- |
| `'none'` | nothing (the default) |
| `'marked'` | a host of `*if` with `*keep`, and a component with `$KeepAlive: true` |
| `'router'` | the above, and every page of a router: by its level, its component and the parameters of its route (not its query) |
| `'all'` | the above, and every host of `*if` |

`*keep="false"` and `$KeepAlive: false` keep an instance out of every scope. The items of a `*for` never sleep (`*keep` there throws). An instance asleep for `MaxAge`, beyond the `Max` asleep (the longest asleep first), or whose place goes away, is destroyed.

Going to sleep, a component or a directive with `$OnSleep` hears it, and so do the ones inside it; `$OnWake` follows when it comes back. Timers, global listeners, media, sockets and data that ages pause and resume there. Before it sleeps, the fields of passwords and of payment cards (`autocomplete="cc-*"`) inside it are emptied: a page asleep keeps no secret.

### Definitions

A definition no instance uses for `MaxAge`, or beyond the `Max` definitions loaded (the longest idle first), unloads the text of its template and style, its stylesheet and its compiled expressions. A definition from files loads them again for its next instance; a definition of code keeps its object and places its style again.

### Statistics

`Elemenx.Cache.Stats()` returns `{Definitions: [{Name, Instances, Cached, Idle}], Instances: [{Name, Asleep}]}`; `Elemenx.Cache.Clear()` destroys every instance asleep and unloads every unused definition, whatever the policy.

A wrong policy throws: `Elemenx.Cache expects a policy object`, `Elemenx.Cache does not know <key>`, `Elemenx.Cache expects Instances.Scope to be none, marked, router or all`, `Elemenx.Cache expects <key> to be a number of 0 or more`.

## Example

Forty sections built lazily, and the counters of the cache of this reference (its policy is `{Instances: {Scope: 'marked'}}`):

```example
<p class="elemenx-text small muted">Built: {{Built}} of 40 (the ones near the screen first, the others one by one while the browser is idle) · instances asleep in this page: {{Asleep}}</p>
<Button Label="Read the cache" (click)="Read" />
<div class="docs-lazy-list" style="display: flex; flex-direction: column; gap: 6px; height: 240px; overflow-y: auto;">
	<div *for="i = 0; i < 40; i++" *key="i">
		<div class="elemenx-callout neutral" *lazy="56"><LazyCounter [index]="i" (built)="Count" /></div>
	</div>
</div>
<script>
(function () {
	if (!window.ElemenxDocsLazy) {
		window.ElemenxDocsLazy = true;

		Elemenx.Component('LazyCounter', {
			$Template: '<span>Section {{Index + 1}}, built at {{Time}}</span>',
			Index: 0,
			Time: '',

			$OnCreate: function () {
				this.Time = new Date().toLocaleTimeString();
				this.$Emit('built', this.Index);
			}
		});
	}

	return {
		Built: 0,
		Asleep: 0,

		Count: function () {
			this.Built++;
		},

		Read: function () {
			this.Asleep = Elemenx.Cache.Stats().Instances.length;
		}
	};
})()
</script>
```

Scroll the page: the count grows as the sections come near, and the rest build while the browser is idle.
