# Elemenx Libraries

A Library is a first-class Elemenx extension graph. It can provide Components, Services, Guards and Directives through the same Discovery and production Bundle mechanisms used by an Application.

Register a library before the Application that uses it:

```js
Elemenx.Library('UI', {
	$Root: 'libraries/UI',
	$Styles: ['ui.css']
});

Elemenx.Application('Application', {
	$Use: ['UI'],
	$Component: 'Root',
	$Root: 'application'
});
```

`$Use` accepts a library name or an Array. The Application exposes the resolved declaration through `$Libraries()`.

In development, Elemenx builds a Discovery graph for every used Library. Component resolution falls back to those graphs when an entity is not present in the Application graph. Library Services and Directives are loaded before the Application root starts. `$Styles` are attached once per Library.

In production, Builder scans Library roots declared in the entry file. Non-Component entities remain available to the Application, while Components are included by reachability from bundled Application templates and then transitively from selected Library Component templates. Unused Library Components are omitted. External templates/styles owned by selected Components are inlined by the normal Bundle pass, while declared `$Styles` assets are copied to their Library path in `dist`. The runtime therefore does not require Library Discovery source graphs to start bundled entities.

The built-in standard library lives at `libraries/UI`. The development server exposes package libraries through `/libraries/`, so examples and installed-package consumers use the same canonical source instead of carrying private copies. Its first vertical slice contains Foundation styles plus Button, Icon, Input and Field. The executable catalogue is the Advanced example route `/ui`.