# A fast application

Most slow pages are slow for a few reasons: too much code to load, too much built at once, work done again for nothing, and a list of ten thousand rows in the DOM. Each has a tool in Elemenx. Measure first: speed you have not measured is a guess.

What you learn: measuring, a smaller build, building less and later (`*lazy`, `*if`, structural directives), lists with `*key` and `VirtualList`, fewer updates (`$Batch`, computed values), keeping what costs (`Elemenx.Cache`, `$OnSleep`), and work off the main thread.

## 1. Measure

- **Lighthouse** in the developer tools of Chrome, on the build (`elemenx serve`), in the mode of a phone: the first paint, the largest paint, the total blocking time, and the shifts of the layout.
- **Performance**, the panel: record a slow action, then look at the long tasks (over 50 milliseconds) and at what ran in them. Elemenx names its work in the stacks (`render`, `$OnUpdate`, the name of your method).
- **In the field**: `PerformanceObserver` for `largest-contentful-paint` and `event` reports what real people get, on their machines.

Measure on a slow machine: the panel of Performance slows the processor four or six times. A page fast on a developer's laptop is not fast on the phone of a customer.

## 2. Load less

`elemenx build` already takes only what the Application uses: the components it renders, the services it names, the parts of the framework it calls, the packs of its libraries. It says what it left out. Keep it able to see:

- Name services and components in quotes (`$Service('Toast')`): a name built at run time (`$Service(name)`) cannot show its use, and the build must keep more.
- Large data (a list of cities, a catalog) goes in a file loaded when it is needed, not in the code.
- Images: the right size for the screen (`srcset`), a modern format (AVIF, WebP), `loading="lazy"` below the first screen, and a `width` and `height` so the layout does not jump when they come.
- Compression and caching on the server: see [Putting it online](/tutorials/deploy).

## 3. Build less, and later

The first screen should build the first screen, not the whole page.

```html
<Header />
<Hero />
<section *lazy="480"><Reviews /></section>
<section *lazy="480"><Pricing /></section>
<Footer *lazy />
```

`*lazy` builds its element when it comes within a screen of the view, or when the browser is idle, one at a time in the order of the page; a placeholder of the height given keeps its place, so nothing jumps. What is inside does not exist before: its components, their requests and their timers start then.

What a person may never open (a tab, a dialog, the settings) is built by `*if` when it opens, not hidden by CSS from the start. A structural directive of your own can decide too: `*media` of [A directive of your own](/tutorials/directive) builds a sidebar only on a wide screen.

## 4. Lists

```html
<li *for="order of Orders" *key="order.ID">...</li>
```

`*key` names each item: when the list changes, an item keeps its element and its components and moves with them, and only the new ones are built. Without it, removing the first item rebuilds the others in their new places. Use a real ID, never `$index`.

A list of thousands is a different problem: thousands of elements are slow to build, to lay out and to keep, whatever the framework. `VirtualList` draws only the rows in view:

```html
<VirtualList [items]="Customers" Height="480px" ItemHeight="40" ItemKey="ID" LabelKey="Name" Label="Customers" (select)="Opened" />
```

A hundred thousand rows cost as much as forty. `Table` pages its rows (`PageSize`) for the same reason.

## 5. Update less

A change of state updates what reads it, at once. A few rules keep that cheap:

- **Several changes, one update**: `this.$Batch(function (state) {...})` or `this.$Update({Loading: false, Items: items})` after an answer of the server, instead of five assignments that update the template five times.
- **Compute once**: a helper called in a template (`Visible(Items, Filter)`) runs at every update of what it reads. If it is costly (sorting thousands, formatting dates), compute the result when its inputs change and keep it in a field.
- **Copy from services what you show**, not more: a component that holds the whole catalog updates for every change of it.
- **Do not replace what did not change**: assigning the same value does nothing, but a new list with the same items rebuilds a `*for` without `*key`.

## 6. Keep what costs

A page left and opened again is built again, its data loaded again. `Elemenx.Cache` keeps it asleep instead:

```js
Elemenx.Cache({Instances: {Scope: 'router', MaxAge: 300000, Max: 10}});
```

The pages of the router sleep for five minutes, ten at most, and wake as they were: their DOM, their state, their scroll. A component that sleeps hears `$OnSleep`: stop its timers and its streams there, and take them up in `$OnWake`. A tab hidden in the background deserves the same (`document.hidden`, as the stream of [A live dashboard](/tutorials/dashboard) does).

## 7. Off the main thread

A computation of a second freezes the page for a second: the clicks wait, the animations stop. Move it to a worker (`Elemenx.WebWorker`): parsing a large file, searching thousands of records, compressing, image processing. Split what must stay on the page into pieces between frames (`requestAnimationFrame`, `requestIdleCallback`).

## 8. A list to keep

- Measured on a slow phone, on the build, before and after.
- The build left out what it could; data and images load when needed.
- The first screen builds the first screen; the rest is `*lazy` or `*if`.
- `*key` on every `*for`; `VirtualList` or pages for long lists.
- `$Batch` for several changes; costly values computed once.
- Pages that come back are cached; timers stop while asleep or hidden.
- No long task over 50 milliseconds on an interaction.
