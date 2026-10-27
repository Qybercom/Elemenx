# The visual builder

`examples/Builder` is a builder of pages: the components of ElemenxUI are taken from a palette onto a canvas, arranged, given their props and their layout, and the result is a template of Elemenx, a Component or a whole Application. It builds the layout and the props of a page, not its bindings or its handlers: those are written in code afterwards.

```bash
npm run example:builder
```

## Projects

A project is one of three kinds, chosen when it is created (File → Create), and it stays that kind:

- **template**: one page; its result is a template to paste into a Component;
- **component**: a Component with its public props and slots;
- **application**: pages and components, the routes, the guards and the settings of the Application (its name, title, language, theme and router).

The projects are kept in the storage of the browser (File → Open lists them) and can be saved into a file and read back from one.

## The screen

- The **Ribbon**: Home (undo, redo, copy, remove, move the selected element), Project (a new page or component, the settings of the Application), Insert (every component of ElemenxUI and the classes of its layouts, by group, with a search) and View (the width of the canvas, its outlines, gaps and rulers).
- The **canvas** in the middle: a sample pressed goes into the selected element, or after it; a sample dragged goes where it is dropped. Run shows the page as it works, and the inspector shows its elements while it runs.
- The **structure** of the page on the left, a tree to select and move elements.
- The **layout and the props** of the selected element on the right; with nothing selected, the document itself (the name and route of a page, the props and slots of a component). The rules of CSS of an element can depend on its state (hover, focus), the width of the screen and the theme.
- The **template** at the bottom, always in step with the canvas.

Keys: Mod+Z, Mod+Shift+Z (or Mod+Y), Mod+D (a copy), Delete, Escape (no selection), and Alt for the key tips of the Ribbon.

## The result

File → Export gives the template of the page, its rules first in a `<style>`; Import reads a template back. File → Application downloads the page or the application as one HTML file that runs alone (the framework and ElemenxUI inside it), or as a project in a zip (`index.html`, `app.js`, `elemenx.config.js` and the Components under `application/`) ready for `elemenx dev` and `elemenx build`; its icon, splash screen and PWA settings go with it.

## The palette

The palette is not a list kept by hand: it is the `$Meta` the Components of the Library declare (their group, icon, description, props with their options, events and the sample the palette inserts), which `elemenx meta` (`npm run meta` in the repository) collects into `data/meta.json`. The type of a prop comes from its default value. A Component of your own Library with a `$Meta` appears in the palette of a builder that uses that Library.

```js
Elemenx.Component('PriceTag', {
	$Meta: {
		Group: 'commerce',
		Icon: 'tag',
		Description: 'A price with its currency.',
		Props: {
			Value: 'The amount.',
			Currency: {Options: ['EUR', 'USD'], Description: 'The currency of the amount.'}
		},
		Sample: {Value: 25, Currency: 'EUR'}
	},
	Value: 0,
	Currency: 'EUR'
});
```

## A builder of your own

The parts of the builder are Components of ElemenxUI around the `Designer` Service, which holds the document, its history and the projects: `DesignerPalette`, `DesignerCanvas`, `DesignerTree`, `DesignerInspector` (with `DesignerStyle` and `DesignerRules`), `DesignerDocument`, `DesignerProject` and `DesignerSettings`. An Application can put them in its own layout:

```html
<Workspace>
	<DesignerPalette slot="left" />
	<DesignerCanvas slot="main" Width="desktop" [rulers]="true" />
	<DesignerInspector slot="right" />
</Workspace>
```

The `Designer` Service is what they share; the code of the Application reads the result from it:

```js
var designer = this.$Service('Designer');

designer.Load(function (error) {
	if (error) return;

	console.log(designer.Template());
});
```

See the reference of each of them in the Library section.
