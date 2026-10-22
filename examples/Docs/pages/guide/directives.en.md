# Directives

A directive is an attribute that starts with `*`. A structural directive decides whether, and how many times, its element is built; a behavioral one adds behavior to an element that is there. Elemenx has the structural ones; ElemenxUI and the Applications add behavioral ones.

## Built in

| Directive | What it does |
| --- | --- |
| `*if="Condition"` | builds the element while the condition holds, destroys it when it does not |
| `*for="item of List"` | builds it for each item; `item in Object` for the keys, `i = 0; i < 5; i++` for a counted loop; `$index` is the place |
| `*key="item.ID"` | names each item of a `*for`, so its element and components move with it |
| `*keep` | a component hidden by `*if` sleeps instead of going, when the cache keeps instances (see [Lazy rendering and cache](/guide/cache)) |
| `*lazy="Placeholder"` | builds the element near the screen, or when the browser is idle |
| `*outlet="Content"` | where the router puts the page of a route (see [Router](/guide/router)) |
| `*pending="#id"`, `*error="#id"` | what a component that is still loading, or failed, shows (see [Lifecycle](/guide/lifecycle)) |

An element has at most one structural directive (`*if`, `*for`, `*lazy`); `*key` and `*keep` are arguments of the one there. For a condition around a list, nest two elements. Behavioral directives may be as many as needed on one element.

```example
<RadioGroup Variant="segmented" [options]="[{Value: 'all', Label: 'All'}, {Value: 'done', Label: 'Done'}, {Value: 'open', Label: 'Open'}]" [value]="Filter" (change)="Filtered" />
<ul>
	<li *for="task of Shown(Tasks, Filter)" *key="task.ID">{{task.Title}}</li>
</ul>
<p *if="!Shown(Tasks, Filter).length" class="elemenx-text muted">Nothing here.</p>
<p>Keys of the first task: <span *for="key in Tasks[0]" *key="key" class="elemenx-badge">{{key}}</span></p>
<p>Stars: <span *for="i = 0; i < Tasks.length; i++" *key="i">★</span></p>
<script>
({
	Filter: 'all',
	Tasks: [{ID: 1, Title: 'Write', Done: true}, {ID: 2, Title: 'Test', Done: false}, {ID: 3, Title: 'Ship', Done: true}],

	$OnCreate: function () {
		this.Shown = function (tasks, filter) {
			return tasks.filter(function (task) {
				return filter === 'all' || (filter === 'done') === task.Done;
			});
		};
	},

	Filtered: function (value) {
		this.Filter = value;
	}
})
</script>
```

## A behavioral directive

```js
Elemenx.Directive('tooltip', {
	$OnCreate: function (context) {
		context.Data.Show = function () {
			context.Element.setAttribute('title', context.Value || '');
		};

		context.Element.addEventListener('mouseenter', context.Data.Show);
	},

	$OnUpdate: function (context) {
		context.Data.Show();
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('mouseenter', context.Data.Show);
	}
});
```

```html
<button type="button" *tooltip="'Saves the document: ' + Name">Save</button>
```

| Hook | When |
| --- | --- |
| `$OnCreate(context)` | the element is in the template, before the first value |
| `$OnUpdate(context)` | the value of the expression is computed: the first time, and at every change of what it reads |
| `$OnDestroy(context)` | the element goes |
| `$OnSleep(context)`, `$OnWake(context)` | the component around it sleeps and wakes |

The context is `{Name, Element, Component, Expression, Value, Data}`: the element, the component of the template (also `this` in the hooks), the text of the expression, its value now, and `Data`, an object of the directive's own for this element. A directive without a value (`*autofocus`) has `Value` `undefined`.

The name of a directive is written in lower case letters, digits, `-` and `_`, and starts with a letter; it is matched without case (`*Tooltip` is `*tooltip`). A name registered twice throws `Elemenx directive already registered: <name>`.

## A structural directive

```js
Elemenx.Directive('unless', {
	Structural: true,

	$OnUpdate: function (context) {
		if (context.Value) context.Unmount();
		else context.Mount();
	}
});
```

```html
<p *unless="Items.length">The cart is empty.</p>
```

A structural directive owns its element: the element becomes a template that the directive builds and takes away. Its context has `Mount()` (builds it, once), `Unmount()` (takes it away; with `*keep` and a cache that keeps it, it sleeps), `Mounted()`, and `Marker`, the node that marks its place.

A collection directive (`Structural: true, Collection: true`) builds the element for many items: its context has `Source(expression)` (the value of an expression in the scope of the template), `Argument(name)` (an argument such as `*key`) and `Render(items, {Mode, Variable, Key})`, as `*for` does. An argument directive (`Kind: 'argument', For: 'collection'` or `'structural'`) is a setting read by them.

## The policy

- An element has at most one structural directive; nest elements for two.
- An argument is valid only next to a structural directive of the host it is made `For`.
- Behavioral directives are created in the order of their attributes, updated in that order, and destroyed in the opposite order.
- A behavioral directive under a structural one lives with the subtree that one builds: it is created when that is built, and destroyed when it goes.

## Example

The two directives of this page, declared in the example. A directive must be registered before the template that uses it is compiled, so the example registers them before its component is made:

```example
<label><input type="checkbox" [(checked)]="Empty" /> the cart is empty</label>
<p *docs-unless="Empty" *docs-glow="Color">The cart has things in it.</p>
<p *if="Empty" class="elemenx-text muted">Nothing in the cart.</p>
<input type="color" [(value)]="Color" />
<script>
/* The directives are registered before the component whose template uses them is made. */
(function () {
	if (!window.ElemenxDocsDirectives) {
		window.ElemenxDocsDirectives = true;

		Elemenx.Directive('docs-unless', {
			Structural: true,

			$OnUpdate: function (context) {
				if (context.Value) context.Unmount();
				else context.Mount();
			}
		});

		Elemenx.Directive('docs-glow', {
			$OnUpdate: function (context) {
				context.Element.style.boxShadow = '0 0 0 3px ' + context.Value;
				context.Element.style.padding = '4px 8px';
			},

			$OnDestroy: function (context) {
				context.Element.style.boxShadow = '';
			}
		});
	}

	return {
		Empty: false,
		Color: '#e0a800'
	};
})()
</script>
```

ElemenxUI brings `*popup`, `*modal`, `*draggable`, `*droppable`, `*resizable`, `*hotkey`, `*copy`, `*badge`, `*swipe`, `*mask`, `*mount`, `*glyph` and `*itemcard` (see the section Directives).
