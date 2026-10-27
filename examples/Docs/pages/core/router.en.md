# How a navigation happens

A click on a link to `/orders/42`, and a moment later the page of the order shows, the URL has changed, and Back returns. Between the two, the router takes seven steps, and any of them may stop or redirect the way.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 484" role="img" aria-label="A navigation, step by step">
	<title>A navigation, step by step</title>
	<rect class="box" x="170" y="20" width="420" height="48" rx="8" />
	<text x="380" y="48.5" text-anchor="middle" class="strong">Go('/orders/42'), a link, Back</text>
	<rect class="box" x="170" y="86" width="420" height="48" rx="8" />
	<text x="380" y="105.5" text-anchor="middle" class="strong">Match: /orders/:id</text>
	<text x="380" y="123.5" text-anchor="middle" class="muted">$Params.id is '42'</text>
	<rect class="box" x="170" y="152" width="420" height="48" rx="8" />
	<text x="380" y="171.5" text-anchor="middle" class="strong">Leave: $OnRouteLeave</text>
	<text x="380" y="189.5" text-anchor="middle" class="muted">the page now may refuse</text>
	<rect class="box accent" x="170" y="218" width="420" height="48" rx="8" />
	<text x="380" y="237.5" text-anchor="middle" class="strong">Guards</text>
	<text x="380" y="255.5" text-anchor="middle" class="muted">true, false, a path instead, or $Wait</text>
	<rect class="box" x="170" y="284" width="420" height="48" rx="8" />
	<text x="380" y="303.5" text-anchor="middle" class="strong">Load the components</text>
	<text x="380" y="321.5" text-anchor="middle" class="muted">from the bundle, or their files</text>
	<rect class="box" x="170" y="350" width="420" height="48" rx="8" />
	<text x="380" y="369.5" text-anchor="middle" class="strong">Commit</text>
	<text x="380" y="387.5" text-anchor="middle" class="muted">render in the outlet, or wake from the cache</text>
	<rect class="box" x="170" y="416" width="420" height="48" rx="8" />
	<text x="380" y="435.5" text-anchor="middle" class="strong">History and title</text>
	<text x="380" y="453.5" text-anchor="middle" class="muted">the URL, $Title, the events of the router</text>
	<polyline class="line" points="380,68 380,86" />
	<polygon class="head" points="380,86 384.5,77.0 375.5,77.0" />
	<polyline class="line" points="380,134 380,152" />
	<polygon class="head" points="380,152 384.5,143.0 375.5,143.0" />
	<polyline class="line" points="380,200 380,218" />
	<polygon class="head" points="380,218 384.5,209.0 375.5,209.0" />
	<polyline class="line" points="380,266 380,284" />
	<polygon class="head" points="380,284 384.5,275.0 375.5,275.0" />
	<polyline class="line" points="380,332 380,350" />
	<polygon class="head" points="380,350 384.5,341.0 375.5,341.0" />
	<polyline class="line" points="380,398 380,416" />
	<polygon class="head" points="380,416 384.5,407.0 375.5,407.0" />
	<rect class="box soft" x="20" y="152" width="124" height="48" rx="8" />
	<text x="82" y="171.5" text-anchor="middle" class="strong">Refused</text>
	<text x="82" y="189.5" text-anchor="middle" class="muted">the page stays</text>
	<polyline class="line" points="170,176 144,176" />
	<polygon class="head" points="144,176 153.0,180.5 153.0,171.5" />
	<rect class="box soft" x="616" y="218" width="124" height="48" rx="8" />
	<text x="678" y="237.5" text-anchor="middle" class="strong">A path</text>
	<text x="678" y="255.5" text-anchor="middle" class="muted">go there instead</text>
	<polyline class="line" points="590,242 616,242" />
	<polygon class="head" points="616,242 607.0,237.5 607.0,246.5" />
</svg>
```

## 1. It starts

A navigation starts in one of three ways: a click on an `<a href>` of the same site (the router catches it, unless it opens a new tab or a download), a call in code (`this.$Router().Go('/orders/42')`, or `Replace`), or Back and Forward of the browser. All three take the same path below. A new navigation that starts while one is on its way makes the older one count for nothing (`NavigationCancel`).

## 2. Match

The router reads the path against its routes, from the outer to the inner: `/orders/:id` matches and gives `$Params.id = '42'`; the query (`?tab=items`) and the hash go to `$Query` and `$Hash`. Nested routes give a chain: the layout of `/orders`, then the page of the order inside its outlet. No route matches: the `NotFound` component of the router, or the browser follows the link itself.

## 3. Leave

The page that shows now may refuse to go: its `$OnRouteLeave(context)` answers like a guard. A form with unsaved changes asks "Leave without saving?" and answers `false` to stay. Routes the old and the new path share (a common layout) are not left at all.

## 4. Guards

Each guard of the new route is asked in turn (`Guard: 'SignedIn'`, or a list):

| A guard returns | The router |
| --- | --- |
| `true` | goes on to the next guard |
| `false` | stops; the page stays, `GuardFailed` shows if the route has one |
| a path (`'/login?return=/orders/42'`) | starts a navigation there instead |
| `this.$Wait(function (done) {...})` | waits for `done(answer)`, showing the `Waiting` component meanwhile |
| `this.$Fail(reason, data)` | stops, with a reason for `GuardFailed` |

Guards answer with a value or a callback, never a Promise. A guard keeps a page from showing; the data behind it are protected by the server.

## 5. Load

The components of the route must be defined. From a bundle they are there; in development, the router asks Discovery for their files and waits (see [From a script to the first screen](/core/startup)). A file that does not load ends the navigation with `NavigationError`, and the URL goes back to where it was.

## 6. Commit

Now the router changes the page: the URL becomes the new one (`NavigationCommit`), the component of each level renders into its outlet (`*outlet="Content"` in the layout above it) with its `$Params`, `$Query` and `$Hash`, and the old one is destroyed, or sleeps when `Elemenx.Cache` keeps pages. A page asleep under the same route and parameters wakes instead of being built. The same route with other parameters keeps its component and only changes its values: a template that reads `$Params.id` follows by itself.

## 7. History and title

The browser history gets an entry (`Go`) or has its entry replaced (`Replace`). A component with `$Title` names the tab. When the components of the route and those inside them that loaded later are all rendered, `NavigationEnd` comes: the moment to move the focus, to send an analytics event, to scroll.

## Where the route lives

| Mode | The URL | For |
| --- | --- | --- |
| `history` | `/orders/42` | a site served over http; the server answers every path with `index.html` |
| `hash` | `/#/orders/42` | a host that cannot rewrite paths |
| `memory` | does not change | a file, a browser extension, a desktop window; the default where there is no http |

The steps are the same in every mode; only the place of the route differs.
