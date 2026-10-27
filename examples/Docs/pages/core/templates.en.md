# From a template to the page

A template is text. A page is a tree of live elements that change when the data changes. This page follows a template from one to the other.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 308" role="img" aria-label="From a template to the page">
	<title>From a template to the page</title>
	<rect class="box soft" x="20" y="20" width="220" height="56" rx="8" />
	<text x="130" y="43.5" text-anchor="middle" class="strong">The template</text>
	<text x="130" y="61.5" text-anchor="middle" class="muted">HTML text</text>
	<rect class="box" x="20" y="110" width="220" height="56" rx="8" />
	<text x="130" y="133.5" text-anchor="middle" class="strong">A DOM tree</text>
	<text x="130" y="151.5" text-anchor="middle" class="muted">parsed, a copy each</text>
	<rect class="box accent" x="20" y="200" width="220" height="56" rx="8" />
	<text x="130" y="223.5" text-anchor="middle" class="strong">The walk</text>
	<text x="130" y="241.5" text-anchor="middle" class="muted">every node, every attribute</text>
	<polyline class="line" points="130,76 130,110" />
	<polygon class="head" points="130,110 134.5,101.0 125.5,101.0" />
	<polyline class="line" points="130,166 130,200" />
	<polygon class="head" points="130,200 134.5,191.0 125.5,191.0" />
	<rect class="box" x="320" y="20" width="420" height="52" rx="8" />
	<text x="530" y="41.5" text-anchor="middle" class="strong">{{ Name }}   [value]   [class.on]</text>
	<text x="530" y="59.5" text-anchor="middle" class="muted">a binding: an effect that updates one node</text>
	<polyline class="line" points="240,228 280,228 280,46 320,46" />
	<polygon class="head" points="320,46 311.0,41.5 311.0,50.5" />
	<rect class="box" x="320" y="92" width="420" height="52" rx="8" />
	<text x="530" y="113.5" text-anchor="middle" class="strong">(click)=&quot;Save&quot;</text>
	<text x="530" y="131.5" text-anchor="middle" class="muted">a listener: the method, found when it comes</text>
	<polyline class="line" points="240,228 280,228 280,118 320,118" />
	<polygon class="head" points="320,118 311.0,113.5 311.0,122.5" />
	<rect class="box" x="320" y="164" width="420" height="52" rx="8" />
	<text x="530" y="185.5" text-anchor="middle" class="strong">*if   *for   *lazy   *tooltip</text>
	<text x="530" y="203.5" text-anchor="middle" class="muted">directives: structural hosts, behavior hooks</text>
	<polyline class="line" points="240,228 280,228 280,190 320,190" />
	<polygon class="head" points="320,190 311.0,185.5 311.0,194.5" />
	<rect class="box" x="320" y="236" width="420" height="52" rx="8" />
	<text x="530" y="257.5" text-anchor="middle" class="strong">&lt;Card [title]=&quot;Title&quot;&gt;</text>
	<text x="530" y="275.5" text-anchor="middle" class="muted">a component: an instance of its own, props given</text>
	<polyline class="line" points="240,228 280,228 280,262 320,262" />
	<polygon class="head" points="320,262 311.0,257.5 311.0,266.5" />
</svg>
```

## 1. Text becomes a tree

```html
<section class="cart">
	<h2>{{Title}}</h2>
	<p [class.empty]="!Items.length">{{Items.length}} items</p>
	<button type="button" (click)="Clear">Clear</button>
	<CartLine *for="item of Items" *key="item.ID" [item]="item" (remove)="Removed" />
</section>
```

The browser's own HTML parser reads the template into a tree of nodes, as it reads any page. Elemenx only prepares the text first: it keeps the case of component names (`CartLine`, which HTML would lower), closes self-closing component tags, and protects expressions that contain characters HTML would take for markup. Each instance of a component gets its own copy of the tree.

## 2. The walk

Elemenx then walks the copy, every node and every attribute, and sorts what it finds:

| In the template | Becomes |
| --- | --- |
| `{{Title}}` in a text | a **text binding** on that text node |
| `[value]`, `[class.empty]`, `[style.width]`, `[attribute.aria-label]` | an **element binding**: a property, a class, a style or an attribute |
| `[(value)]` | a binding and a listener: a field that follows the input and the other way round |
| `(click)="Clear"` | a **listener** |
| `#Name` | a **ref**: `this.$Ref('Name')` finds the element |
| `*if`, `*for`, `*lazy` and your structural directives | a **host**: the element becomes a template the directive builds and takes away |
| `*tooltip` and other behavioral directives | a **directive** with its hooks |
| `<CartLine ...>` | a **component**: an instance of its own, its props given |

## 3. Expressions become functions

`{{Items.length}}` and `!Items.length` are JavaScript expressions. Each one is compiled once into a function, and that function is kept by its text: a thousand rows with `{{item.Title}}` share one function. The function reads names from the state of the component first, then from its methods and the helpers of the framework (`$T`, `$Params`).

A page whose security policy forbids `eval` (a browser extension, a strict site) cannot compile at run time: a build with `--precompile` writes these functions into the code, and the template compiler takes them from there.

## 4. Bindings become effects

Each binding becomes an **effect**: a small function that evaluates its expression and writes the result into its one node. The effect runs once at the start, and from then on whenever the data it read changes (see [How state updates the page](/core/reactivity)). That is the whole update system: no render function for the component, no tree to compare. When `Items.length` changes, the text node of the count and the class of the paragraph are rewritten; the heading, the button and the lines are not touched.

## 5. Listeners find their method when the event comes

`(click)="Clear"` adds a listener to the button. It looks up `Clear` when the click happens, not when the template is compiled, so a method set later (in `$OnCreate`, say) is found too. On a component tag, `(remove)` listens to what the child emits (`this.$Emit('remove', data)`); on an element, to a DOM event, including custom ones a directive dispatches.

## 6. Structural directives own their element

`*if`, `*for` and `*lazy` take their element out of the tree and leave a marker (an empty comment) in its place. The element becomes a template of its own: the directive builds a copy at the marker when it should exist (`*if` true, each item of `*for`) and destroys it when it should not, with the components and effects inside. `*for` with `*key` keeps the copy of each item by its key, so when the list changes, the existing rows move instead of being rebuilt.

## 7. Components become instances

`<CartLine [item]="item" (remove)="Removed">` is replaced by an instance of `CartLine`: its own template, state and effects. `[item]` becomes a prop: an effect of the parent writes the value into the child, and the child hears `$OnProps` when it changes. `class` and `style` on the tag go on the root element of the child. What is written between the tags of a component is its **content**: it is compiled in the scope of the parent, and the child places it where its template has a `<slot>` (see [The life of a component](/core/components)).

## What it costs

Compiling is done once per instance, and the work is proportional to the size of the template. Updates are proportional to what changed, not to the size of the page. That is why a large page with a few changing numbers stays fast, and why a list of ten thousand rows is slow whatever the framework: ten thousand rows are ten thousand elements, and [VirtualList](/components/VirtualList) draws only those in view.
