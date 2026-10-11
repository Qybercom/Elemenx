# Elemenx Libraries

A Library is a first-class Elemenx extension graph. It can provide Components, Services, Guards and Directives through the same Discovery and production Bundle mechanisms used by an Application.

External libraries are registered before the Application that uses them:

```js
Elemenx.Library('Mosaic', {
	$Root: 'libraries/Mosaic'
});

Elemenx.Application('Application', {
	$Use: ['Mosaic'],
	$Component: 'Root',
	$Root: 'application'
});
```

`$Use` accepts a library name or an Array. The Application exposes the resolved declaration through `$Libraries()`.

In development, Elemenx builds a Discovery graph for every used Library. Component resolution falls back to those graphs when an entity is not present in the Application graph. Library Services and Directives are loaded before the Application root starts. CSS files listed by the Library `index.js` are attached once per Library. Unknown names in `$Use` are skipped with a warning and do not block Application startup; errors while loading an existing Library remain fatal for that startup.

In production, Builder scans Library roots declared in the entry file. Non-Component entities remain available to the Application, while Components are included by reachability from bundled Application templates and then transitively from selected Library Component templates. Unused Library Components are omitted. External templates/styles owned by selected Components are inlined by the normal Bundle pass, while CSS assets declared by the Library graph are copied to their Library path in `dist`. The runtime therefore does not require Library Discovery source graphs to start bundled entities.

The built-in standard library is named `ElemenxUI` and lives at `libraries/ElemenxUI`. It is available without an explicit `Elemenx.Library(...)` declaration; an Application only needs `$Use: ['ElemenxUI']`. The development server exposes package libraries through `/libraries/`, so examples and installed-package consumers use the same canonical source instead of carrying private copies. The executable catalogue is the Advanced example route `/ui`.

## ElemenxUI

### Styles

The Library `index.js` attaches these stylesheets to every Application that uses ElemenxUI:

- `index.css`: the foundation: fonts, `html`/`body`, the theme colors, scrollbars, headings and the layout primitives `elemenx-screen`, `elemenx-container` and `elemenx-column` with their modifiers (`fill`, `centered`, `wrappable`...);
- `common.css`: typography (`elemenx-title`, `elemenx-text`, `elemenx-label`, `elemenx-caption`, `elemenx-footnote`, `elemenx-link`, `elemenx-code`, `elemenx-kbd`), blocks (`elemenx-panel`, `elemenx-card`, `elemenx-block`, `elemenx-section`, `elemenx-callout`, `elemenx-badge`, `elemenx-divider`, `elemenx-spacer`) and the floating panels and options shared by the dropdowns;
- `button.css`, `input.css`, `choice.css`: the controls that several Components share, so they stay available when only one of those Components is bundled.

The theme follows `body[data-theme='dark']`. Every color is a `--elemenx-*` variable of the theme, so a Component never names a color directly. Sizes follow the 8-4-2-1 grid: controls are `small` (24px), `medium` (32px, the default), `large` (40px) and `giant` (56px), the base font is 14/20px.

### Icons

`icons.svg` is the sprite of the semantic icons: `<Icon Name="save" />`, with `Size` (16 by default) and `Label` for an icon that carries meaning on its own. The catalogue lists every name.

### Components

Components take their data as props and report changes by events; the event of a value change carries the new value.

- Actions: `Button` (`Variant`: primary, secondary, ghost, danger, link; `Size`; `Icon`, `IconRight`; `Loading`, `Pressed`, `Block`), `ButtonGroup`, `Menu` and `MenuList` (multi-level menus), `Toolbar`.
- Text input: `Field` (label, hint and error around a control), `Input` (`Type`, `Icon`, `Prefix`, `Suffix`, `Clearable`, `Mask`), `TextArea`, `NumberInput`, `DateInput`, `TimeInput`, `ColorInput`, `CardNumberInput`, `CardExpiryInput`, `CVVInput`, `PhoneInput` (configurable `Countries`).
- Choice: `Checkbox` (`Variant`: default, chip, tile; `Indeterminate`), `Radio`, `RadioGroup` (`Variant`: default, horizontal, tile, segmented), `Toggle`, `Select`, `MultiSelect`, `Tabs` (`Variant`: line, pill, editor).
- Files: `FileUpload` (`Variant`: dropzone, inline, gallery, avatar): it picks files and previews images; uploading is up to the Application.
- Layout: `Workspace`, an IDE-like frame with the slots `header`, `left-stripe`, `left`, `main`, `bottom`, `right`, `right-stripe` and `status` and resizable tool window areas; `ToolWindow` for the content of an area.

Two Directives support them: `*popup` places a floating panel next to its anchor and dismisses it on an outside press or Escape; `*mask` keeps an input inside a mask (`#` digit, `A` letter, `*` both) whatever way the text arrives.