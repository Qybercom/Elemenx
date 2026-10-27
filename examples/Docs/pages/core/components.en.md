# The life of a component

A component is a definition (a template, a style, fields and methods) and, once used, any number of instances of it. This page follows one instance from its birth to its end, and shows how it talks to the components around it.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 336" role="img" aria-label="The life of a component">
	<title>The life of a component</title>
	<rect class="box" x="20" y="20" width="136" height="56" rx="8" />
	<text x="88" y="43.5" text-anchor="middle" class="strong">Instance</text>
	<text x="88" y="61.5" text-anchor="middle" class="muted">state copied</text>
	<rect class="box" x="166" y="20" width="136" height="56" rx="8" />
	<text x="234" y="43.5" text-anchor="middle" class="strong">$OnCreate</text>
	<text x="234" y="61.5" text-anchor="middle" class="muted">template ready</text>
	<rect class="box" x="312" y="20" width="136" height="56" rx="8" />
	<text x="380" y="43.5" text-anchor="middle" class="strong">In the page</text>
	<text x="380" y="61.5" text-anchor="middle" class="muted">$OnReady</text>
	<rect class="box accent" x="458" y="20" width="136" height="56" rx="8" />
	<text x="526" y="43.5" text-anchor="middle" class="strong">Lives</text>
	<text x="526" y="61.5" text-anchor="middle" class="muted">updates, $OnProps</text>
	<rect class="box" x="604" y="20" width="136" height="56" rx="8" />
	<text x="672" y="43.5" text-anchor="middle" class="strong">$OnDestroy</text>
	<text x="672" y="61.5" text-anchor="middle" class="muted">all of it released</text>
	<polyline class="line" points="156,48 166,48" />
	<polygon class="head" points="166,48 157.0,43.5 157.0,52.5" />
	<polyline class="line" points="302,48 312,48" />
	<polygon class="head" points="312,48 303.0,43.5 303.0,52.5" />
	<polyline class="line" points="448,48 458,48" />
	<polygon class="head" points="458,48 449.0,43.5 449.0,52.5" />
	<polyline class="line" points="594,48 604,48" />
	<polygon class="head" points="604,48 595.0,43.5 595.0,52.5" />
	<rect class="box soft" x="458" y="112" width="136" height="52" rx="8" />
	<text x="526" y="133.5" text-anchor="middle" class="strong">$OnSleep / $OnWake</text>
	<text x="526" y="151.5" text-anchor="middle" class="muted">kept by the cache</text>
	<polyline class="line" points="508,76 508,112" />
	<polygon class="head" points="508,112 512.5,103.0 503.5,103.0" />
	<polyline class="line" points="544,112 544,76" />
	<polygon class="head" points="544,76 539.5,85.0 548.5,85.0" />
	<rect class="box" x="180" y="198" width="400" height="44" rx="8" />
	<text x="380" y="224.5" text-anchor="middle" class="strong">The parent component</text>
	<rect class="box accent" x="180" y="272" width="400" height="44" rx="8" />
	<text x="380" y="298.5" text-anchor="middle" class="strong">&lt;Child [items]=&quot;List&quot; (select)=&quot;Picked&quot;&gt;</text>
	<polyline class="line" points="290,242 290,272" />
	<polygon class="head" points="290,272 294.5,263.0 285.5,263.0" />
	<polyline class="line" points="470,272 470,242" />
	<polygon class="head" points="470,242 465.5,251.0 474.5,251.0" />
	<text x="280" y="262" text-anchor="end" class="muted">props [items]</text>
	<text x="480" y="262" text-anchor="start" class="muted">events (select)</text>
</svg>
```

## A definition, many instances

```js
Elemenx.Component('CartLine', {
	$TemplateURL: 'CartLine.html',
	$StyleURL: 'CartLine.css',
	Item: null,
	Quantity: 1,
	Tags: [],

	Remove: function () {
		this.$Emit('remove', {ID: this.Item.ID});
	}
});
```

`Elemenx.Component` records the definition; nothing is built yet. A definition with `$TemplateURL` or `$StyleURL` loads those files the first time an instance is needed; its style is added to the page once, whatever the number of instances.

## Birth

When a template meets `<CartLine>`, an instance is made:

1. **State.** The fields of the definition are copied: plain objects and lists deeply, so two instances never share `Tags: []`. The props given by the tag (`[item]="item"`) are set over them. The state is made reactive.
2. **Template.** The template is compiled for this instance: its bindings, listeners, directives and child components (see [From a template to the page](/core/templates)).
3. **`$OnCreate`.** Your code runs: the state and the template are there, the element is not in the page yet. This is the place to set fields, to ask services, to subscribe.
4. **In the page.** The element goes into its place. **`$OnReady`** runs: now the element has a size, the focus can go to it, a library that needs a real element can start.

## Props down, events up

A parent gives data to a child through **props**, and the child tells the parent what happened through **events**. Neither reaches into the other.

- `[items]="List"` is an effect of the parent: when `List` changes, the new value is written into the child's `Items`, and the child's `$OnProps` hears it. The child should not change its props itself: the next update of the parent would overwrite them.
- `this.$Emit('select', data)` in the child calls the method of the parent named in `(select)="Picked"`, with `data`.
- `this.$Parent()` and `this.$Ref('Name')` exist for the rare case a component must call another directly.

## Content and slots

What is written between the tags of a component is its content:

```html
<Card>
	<h3 slot="header">{{Product.Name}}</h3>
	<p>{{Product.Description}}</p>
</Card>
```

The content belongs to the parent: its expressions read the parent's state, its listeners call the parent's methods. The child decides where it goes: `<slot name="header">` takes the elements with `slot="header"`, `<slot>` the rest. When a slot is inside an `*if` of the child that turns false, the content placed there is destroyed with it and built again when it turns true; with `*keep` it sleeps instead and comes back as it was.

`class` and `style` written on the tag of a component go on the root element of its instance, beside its own classes, so `<Card class="wide">` works as it reads.

## Living

While it lives, the component's effects keep its element up to date, its listeners call its methods, and its props follow its parent. A component whose definition is still loading (in development, or with a remote template) shows a placeholder, its `*pending` template if it has one, and takes its place when it is ready; a failure shows its `*error` template.

## Sleep and wake

When an `*if` turns false, or the router leaves a page, the instance is normally destroyed. With `Elemenx.Cache` keeping instances (or `*keep`, or `$KeepAlive`), it **sleeps** instead: its element leaves the page but stays whole in memory, with its state and its scroll. `$OnSleep` runs: stop timers and streams there. When it is needed again it **wakes** in its place, `$OnWake` runs, and nothing is rebuilt. An instance asleep too long, or beyond the number the cache keeps, is destroyed.

## Death

`$OnDestroy` runs, and then Elemenx releases everything the instance had: the effects of its bindings, the listeners it added through its template, its directives (each runs its own `$OnDestroy`), the network resources, events and messages it opened through `$Network`, `$Events` and `$Messaging`, and its child components, deepest first. What you added yourself (a listener on `window`, a timer, an observer) is yours to remove in `$OnDestroy`.
