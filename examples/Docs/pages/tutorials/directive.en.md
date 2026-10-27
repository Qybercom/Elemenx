# A directive of your own

Two directives a real application needs: `*inview`, which tells when an element comes into the screen (to animate it, to count a view, to load more), and `*media`, which builds an element only while a media query holds. The first adds behavior to an element; the second decides whether the element exists.

What you learn: when a directive is the right tool, the hooks of a behavioral directive and its `Data`, cleaning up, sleeping and waking, a structural directive with `Mount` and `Unmount`, and testing a directive.

## 1. A directive, a component or a service?

- A **component** has its own markup: a card, a picker.
- A **service** has state and logic and no element: a session, a cart.
- A **directive** adds behavior to an element that someone else wrote: any element, any component's root, without wrapping it. `*copy`, `*hotkey`, `*draggable` of ElemenxUI are directives.

If you would otherwise add the same `addEventListener` in `$OnReady` of ten components, it is a directive.

## 2. `*inview`: the hooks

```js
/*
 * *inview tells when its element comes into the screen: it gets the class in-view and emits inview with {Visible}.
 * The value is {Threshold (0 to 1, the share that must show), Once (stop after the first time)}, or nothing.
 */
Elemenx.Directive('inview', {
	$Meta: {
		Description: '*inview tells when its element comes into the screen: the class in-view and the event inview with {Visible}.'
	},

	$OnCreate: function (context) {
		context.Data.Seen = function (entries) {
			var visible = entries[entries.length - 1].isIntersecting;
			var options = context.Value || {};

			context.Element.classList.toggle('in-view', visible);
			context.Element.dispatchEvent(new CustomEvent('inview', {detail: {Visible: visible}}));

			if (visible && options.Once)
				context.Data.Observer.disconnect();
		};
	},

	$OnUpdate: function (context) {
		var threshold = Number((context.Value || {}).Threshold) || 0;

		/* A new value of the expression with the same threshold: nothing to do. */
		if (context.Data.Observer && context.Data.Threshold === threshold) return;

		if (context.Data.Observer)
			context.Data.Observer.disconnect();

		context.Data.Threshold = threshold;
		context.Data.Observer = new IntersectionObserver(context.Data.Seen, {threshold: threshold});
		context.Data.Observer.observe(context.Element);
	},

	$OnSleep: function (context) {
		context.Data.Observer.disconnect();
	},

	$OnWake: function (context) {
		context.Data.Observer.observe(context.Element);
	},

	$OnDestroy: function (context) {
		if (context.Data.Observer)
			context.Data.Observer.disconnect();
	}
});
```

- `$OnCreate` runs once, when the element is in the template, before its value; `$OnUpdate` runs with the first value and again each time what the expression reads changes; `$OnDestroy` when the element goes.
- `context.Data` is the directive's own object for this element: two elements with `*inview` never share an observer.
- **Clean up** everything you started in `$OnDestroy`: an observer, a listener on `window`, a timer. A directive that forgets it leaks on every page of the router.
- A component kept by the cache sleeps instead of going: `$OnSleep` and `$OnWake` stop and resume what costs while nobody sees it.
- The event is a DOM event of the element, so the template listens to it as to a click:

```html
<section class="feature" *inview="{Threshold: 0.4, Once: true}" (inview)="Seen">...</section>
```

```css
.feature {
	opacity: 0;
	transform: translateY(16px);
	transition: opacity 0.4s, transform 0.4s;
}

.feature.in-view {
	opacity: 1;
	transform: none;
}

@media (prefers-reduced-motion: reduce) {
	.feature {
		opacity: 1;
		transform: none;
		transition: none;
	}
}
```

Respect `prefers-reduced-motion`: an animation that moves the page makes some people sick.

## 3. `*media`: a structural directive

```js
/* *media="'(min-width: 800px)'" builds its element while the media query holds, and takes it away when it does not. */
Elemenx.Directive('media', {
	Structural: true,

	$OnUpdate: function (context) {
		if (context.Data.Query)
			context.Data.Query.removeEventListener('change', context.Data.Changed);

		context.Data.Query = window.matchMedia(context.Value);
		context.Data.Changed = function () {
			if (context.Data.Query.matches) context.Mount();
			else context.Unmount();
		};

		context.Data.Query.addEventListener('change', context.Data.Changed);
		context.Data.Changed();
	},

	$OnDestroy: function (context) {
		if (context.Data.Query)
			context.Data.Query.removeEventListener('change', context.Data.Changed);
	}
});
```

```html
<aside class="sidebar" *media="'(min-width: 800px)'">...</aside>
```

A structural directive owns its element: `Mount()` builds it (once), `Unmount()` takes it away, with the components inside. CSS could only hide the sidebar; `*media` does not build it at all on a phone, so its components, their requests and their timers never start there. An element has one structural directive at most (`*if`, `*for`, `*lazy`, `*media`); for two, nest two elements.

## 4. Where to declare them

Register a directive before the templates that use it are compiled: list its file in the `index.js` of the Application or of its library, before the components. A name is written in lower case (`*inview`, `*long-press`); registered twice, it throws. In a library, add `$Meta` with its `Description`: the tools and the reference show it.

## 5. Testing

A directive is tested in a browser, on an element of a small component:

```js
it('*inview marks its element and tells it', async function () {
	var seen = [];
	var host = Elemenx.Component('Host', {
		$Template: '<div style="height: 50px" *inview (inview)="Seen"></div>',
		Seen: function (event) {
			seen.push(event.detail.Visible);
		}
	})();

	document.body.appendChild(host.$Element());

	await waitFor(function () {
		return seen.length;
	});

	expect(host.$Element().querySelector('div').classList.contains('in-view')).toBe(true);
	expect(seen).toEqual([true]);

	host.$Destroy();
});
```

Test the cleaning too: after `$Destroy`, the observer or the listener must be gone (a spy on `disconnect` or `removeEventListener`).

## Example

The two directives, registered here before the component of the example is made. Scroll so the box leaves the screen and comes back; make the window narrower than 800 pixels:

```example
<div class="elemenx-text small muted">Shown {{Times}} times · {{State}}</div>
<div style="height: 120px; overflow: auto; border: 1px solid var(--elemenx-border); border-radius: 8px; margin-block: 8px;">
	<div style="height: 160px; padding: 8px;">Scroll down ↓</div>
	<div class="elemenx-card" style="padding: 12px;" *tutorial-inview="{Threshold: 0.5}" (inview)="Seen">I am in view</div>
	<div style="height: 160px;"></div>
</div>
<p class="elemenx-callout" *tutorial-media="'(min-width: 800px)'">This line exists only on a window at least 800 pixels wide.</p>
<script>
(function () {
	if (!window.ElemenxTutorialDirectives) {
		window.ElemenxTutorialDirectives = true;

		Elemenx.Directive('tutorial-inview', {
			$OnCreate: function (context) {
				context.Data.Seen = function (entries) {
					var visible = entries[entries.length - 1].isIntersecting;

					context.Element.dispatchEvent(new CustomEvent('inview', {detail: {Visible: visible}}));
				};
			},

			$OnUpdate: function (context) {
				if (context.Data.Observer) return;

				context.Data.Observer = new IntersectionObserver(context.Data.Seen, {root: context.Element.parentNode, threshold: Number((context.Value || {}).Threshold) || 0});
				context.Data.Observer.observe(context.Element);
			},

			$OnDestroy: function (context) {
				if (context.Data.Observer)
					context.Data.Observer.disconnect();
			}
		});

		Elemenx.Directive('tutorial-media', {
			Structural: true,

			$OnUpdate: function (context) {
				if (context.Data.Query)
					context.Data.Query.removeEventListener('change', context.Data.Changed);

				context.Data.Query = window.matchMedia(context.Value);
				context.Data.Changed = function () {
					if (context.Data.Query.matches) context.Mount();
					else context.Unmount();
				};

				context.Data.Query.addEventListener('change', context.Data.Changed);
				context.Data.Changed();
			},

			$OnDestroy: function (context) {
				if (context.Data.Query)
					context.Data.Query.removeEventListener('change', context.Data.Changed);
			}
		});
	}

	return {
		Times: 0,
		State: 'out of view',

		Seen: function (event) {
			this.State = event.detail.Visible ? 'in view' : 'out of view';

			if (event.detail.Visible)
				this.Times += 1;
		}
	};
})()
</script>
```
