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

The Library `index.js` attaches one stylesheet, `index.css`, to every Application that uses ElemenxUI. It holds the foundation (fonts, `html`/`body`, the theme colors, scrollbars, headings, the layout primitives `elemenx-screen`, `elemenx-container` and `elemenx-column` with their modifiers `fill`, `centered`, `wrappable`, `block`...) and everything shared by several Components: typography (`elemenx-title`, `elemenx-text`, `elemenx-label`, `elemenx-caption`, `elemenx-footnote`, `elemenx-link`, `elemenx-code`, `elemenx-kbd`), lists (`elemenx-ul`, `elemenx-ol`, `elemenx-ol outline`, `elemenx-ul check`, `elemenx-list divided`), blocks (`elemenx-panel`, `elemenx-card`, `elemenx-block`, `elemenx-section`, `elemenx-callout`, `elemenx-badge`, `elemenx-divider`, `elemenx-spacer`), tables (`elemenx-table` with `compact`, `striped`, `bordered`, `sticky`), the field and choice controls, floating panels, loaders and drag and drop. Every other Component carries its own stylesheet, which the production Bundle includes only when the Component is used.

The theme policy is the `data-theme` attribute of `body`: `system` (or no attribute) follows the operating system through `prefers-color-scheme`, `light` and `dark` force a theme. `index.css` applies the policy before any script runs. Every color is a `--elemenx-*` variable of the theme, so a Component never names a color directly. Sizes follow the 8-4-2-1 grid: controls are `small` (24px), `medium` (32px, the default), `large` (40px) and `giant` (56px); the base font is 14/20px. `Shape="round"` (the class `round`) rounds a button or a field.

### Icons

`icons.svg` is the sprite of the semantic icons: `<Icon Name="save" />`, with `Size` (16 by default) and `Label` for an icon that carries meaning on its own. It includes alignment (`align-*`), position (`position-*`), fit (`fit-*`) and sort direction icons, and file format icons (`file-js`, `file-pdf`...): a sheet with a colored badge. `<FileIcon Name="report.pdf" />` picks the icon of a file name. The catalogue lists every name.

### Services

- `Theme`: `Policy()` returns the policy, `Policy('dark')` sets it, `Next()` cycles it, `Resolved()` returns the theme shown; `OnChange(callback)`/`OffChange(callback)` report `{Policy, Theme}`, including system changes under `system`. The policy is remembered in `localStorage` (`Persist`, `StorageKey`); the first one comes from storage, then from the page's `data-theme`, then from `Default` (`system`).
- `Countries`: `List(locale)` returns every country with `Code`, localized `Name`, dialling code `Dial`, national number `Mask` and `Currency`, sorted by name; `Find(code)`, `Match(digits, preferred)`.
- `Currencies`: `List(locale)` returns every ISO 4217 currency with `Code`, localized `Name`, `Symbol` and fraction `Digits`; `Find(code)`, `Format(amount, code)`.
- `Toast`: `Show({Title, Message, Variant, Duration, Action})`, `Dismiss(id)`, `Clear()`; a `ToastHost` in the layout shows the toasts.

### Directives

- `*popup` places a floating panel next to its anchor and dismisses it on an outside press or Escape.
- `*modal` opens a `<dialog>` as a modal.
- `*mask` keeps an input inside a mask (`#` digit, `A` letter, `*` both) whatever way the text arrives; `Guide` shows the whole template, `Backspace: 'skip'` moves over separators.
- `*resizable` adds resize handles (`right`, `left`, `bottom`, `top`, `corner`) with limits and keyboard support.
- `*draggable` and `*droppable` drag items by pointer onto targets that accept their `Type`; a target can also take files and text dragged from outside the browser.

### Components

Components take their data as props and report changes by events; the event of a value change carries the new value.

- Actions: `Button` (`Variant`: primary, secondary, ghost, danger, link; `Size`; `Shape`; `Icon`, `IconRight`; `Loading`, `Pressed`, `Block`), `ButtonGroup`, `Menu` and `MenuList` (multi-level menus).
- Text input: `Field` (label, hint and error around a control), `Input` (`Type`, `Icon`, `Prefix`, `Suffix`, `Clearable`, `Mask`), `TextArea` (resizable or `AutoSize`), `NumberInput`, `DateInput` (own calendar; `Mode` date or month, `Format` from the locale or `DD`/`MM`/`YYYY`, `Min`, `Max`, `FirstDay`), `TimeInput` (own picker; `Seconds`, `MinuteStep`, `Min`, `Max`), `ColorInput` (own picker; `Alpha`, `Swatches`, eyedropper where supported), `CardNumberInput`, `CardExpiryInput`, `CVVInput`, `PhoneInput` (every country by default; `Guide`, `Backspace`), `MoneyInput`, `CurrencySelect`.
- Choice: `Checkbox` (`Variant`: default, chip, tile; `Indeterminate`), `Radio`, `RadioGroup` (`Variant`: default, horizontal, tile, segmented), `Toggle`, `Select`, `MultiSelect`, `Tabs` (`Variant`: line, pill, editor), `Slider` (one value or a range).
- Data: `Table` (columns, sorting, row selection, sticky header, resizable columns), `Section` (collapsible, with header actions).
- Overlays: `Popover`, `Dialog`, `ToastHost`.
- Feedback: `Progress` (bar or ring, determinate or not), `Meter`, `Spinner`, `Skeleton`.
- Files: `FileUpload` (`Variant`: dropzone, inline, gallery, avatar): it picks files and previews images; uploading is up to the Application. `FileIcon`.
- Theme: `ThemeSwitch`.
- Layout: `Splitter`; `Workspace`, an IDE-like frame with the slots `header`, `top-stripe`, `left-stripe`, `left`, `main`, `bottom`, `right`, `right-stripe`, `bottom-stripe` and `status` and resizable tool window areas, with `WorkspaceToolbar` and `WorkspaceToolWindow`; `Chat` with `ChatMessage` and `ChatComposer`.