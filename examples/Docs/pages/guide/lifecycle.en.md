# Lifecycle

A component is created, rendered, maybe put to sleep and woken, and destroyed; an Application starts and is ready or fails. Hooks in the definition run at each of these moments, with the component (or the Application) as `this`.

## A component

| Hook | When | For |
| --- | --- | --- |
| `$OnCreate(data)` | the state has its first values (the defaults, then the props of the tag in `data`), before the first rendering | the helpers of the template, values computed from the props, listeners of services |
| `$OnReady()` | the template is rendered and in the component's element; the values of the route are there | measuring the DOM, focusing a field, starting a request, a timer |
| `$OnSleep()` | the component leaves the page but is kept (see [Lazy rendering and cache](/guide/cache)) | pausing timers, media, sockets |
| `$OnWake()` | it comes back as it was | resuming them |
| `$OnDestroy()` | it goes for good | removing what it added outside itself: listeners of `window` and of services, timers |

```js
Elemenx.Component('Clock', {
	$Template: '<time>{{Now}}</time>',
	Now: '',

	$OnCreate: function () {
		this.Tick = this.Tick.bind(this);
	},

	$OnReady: function () {
		this.Tick();
		this.Timer = setInterval(this.Tick, 1000);
	},

	$OnSleep: function () {
		clearInterval(this.Timer);
	},

	$OnWake: function () {
		this.$OnReady();
	},

	$OnDestroy: function () {
		clearInterval(this.Timer);
	},

	Tick: function () {
		this.Now = new Date().toLocaleTimeString();
	}
});
```

What a component owns ends with it without a hook: its requests and sockets (`$Network`), event and message sockets (`$Events`, `$Messaging`), workers (`$WebWorker`), the listeners of its template, its directives and the components of its template. `$OnDestroy` runs before its children are destroyed, while its element is still in the page.

The listeners of its tag and its `$Parent()` are there before `$OnCreate`: an event it emits from `$OnCreate` or `$OnReady` reaches its owner.

`$OnCreate`, `$OnReady`, `$OnDestroy`, `$OnSleep` and `$OnWake` run untracked: what they read does not make the template of the parent that creates the component (a row of a `*for`) depend on it.

## Components that load later

In development, a component named by a template may not be loaded yet: its tag holds its place while its files come. The component around it hears about it:

| Hook | When |
| --- | --- |
| `$OnChildPending(child)` | a component inside it started loading |
| `$OnChildReady(child)` | it is rendered |
| `$OnChildError(child)` | it could not load (`child.Error`) |

`child` is `{Name, $Element, Error}`. Without hooks, the tag may show its own status: `*pending` shows markup while it loads and `*error` when it failed, each a template of the page (`'#id'`) or a text:

```html
<Chart *pending="#chart-loading" *error="#chart-failed" [data]="Sales" />
```

A component that fails with nobody to hear it writes the error to the console. The root of an Application reports to the Application.

## An Application

| Hook | When |
| --- | --- |
| `$Bootstrap()` | first, before anything loads |
| `$OnPending()` | the root started loading (the mount shows `$Pending`) |
| `$OnReady()` | the root is rendered |
| `$OnError(error)` | the root, or a component it needs to start, failed (the mount shows `$Error`) |

The router of an Application starts with its root: the page of the first route is rendered after `$OnReady` of the root, and a Waiting component shows meanwhile (see [Router](/guide/router)).

## The order

For a component with children in its template: the parent's `$OnCreate`, then its rendering, which creates every child (each with its `$OnCreate`, rendering and `$OnReady`), then the parent's `$OnReady`. Destroying goes the other way: the parent's `$OnDestroy`, then its children.

The content of the tag of a component (what goes into its slots: `<Section><Window /></Section>`) is made with the first instance of that component, before its `$OnCreate`, so its hooks see it built. A component never shown (`<Section *if="false">`) makes nothing of its content, and a `*lazy` in that content waits too.

## Example

The child logs its hooks. `*if` destroys it; with `*keep` it sleeps and wakes instead:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Toggle Label="Shown" [checked]="Shown" (change)="Show" />
	<Toggle Label="*keep" [checked]="Keep" (change)="Kept" />
</div>
<div class="elemenx-panel" *if="Shown && !Keep"><LifeProbe Name="plain" (life)="Logged" /></div>
<div class="elemenx-panel" *if="Shown && Keep" *keep><LifeProbe Name="kept" (life)="Logged" /></div>
<ol class="elemenx-ol"><li *for="line of Log" *key="$index">{{line}}</li></ol>
<script>
({
	Shown: true,
	Keep: false,
	Log: [],

	$OnCreate: function () {
		if (window.ElemenxDocsLifeProbe) return;

		window.ElemenxDocsLifeProbe = true;

		Elemenx.Component('LifeProbe', {
			$Template: '<p>The {{Name}} child, created at {{Created}}</p>',
			Name: '',
			Created: '',

			$OnCreate: function () {
				this.Created = new Date().toLocaleTimeString();
				this.$Emit('life', this.Name + ': $OnCreate');
			},

			$OnReady: function () {
				this.$Emit('life', this.Name + ': $OnReady');
			},

			$OnSleep: function () {
				this.$Emit('life', this.Name + ': $OnSleep');
			},

			$OnWake: function () {
				this.$Emit('life', this.Name + ': $OnWake');
			},

			$OnDestroy: function () {
				this.$Emit('life', this.Name + ': $OnDestroy');
			}
		});
	},

	Show: function (value) {
		this.Shown = value;
	},

	Kept: function (value) {
		this.Keep = value;
	},

	Logged: function (line) {
		this.Log = this.Log.concat([line]).slice(-8);
	}
})
</script>
```

The kept child sleeps only when the cache keeps instances: this reference sets `Elemenx.Cache({Instances: {Scope: 'marked'}})`, so `*keep` works here (see [Lazy rendering and cache](/guide/cache)).
