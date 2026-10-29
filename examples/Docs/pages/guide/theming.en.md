# Themes

The look of ElemenxUI is its tokens: CSS variables `--elemenx-*` for the colors, the type, the corners, the sizes and the motion, and the variables of each component. A theme sets them, and where tokens are not enough it restyles a component by its classes. A theme is one plain CSS file: no build step, no cascade layers, any browser that runs ElemenxUI.

## The scheme and the theme

`body` carries two attributes, set by the `Theme` service:

- `data-theme`: the policy of the scheme under the default theme (`system`, `light`, `dark`; `index.css` applies it before any script runs), or the name of a named theme (`contrast`, `ocean`...);
- `data-scheme`: the scheme shown, `light` or `dark`, whatever the theme.

```js
var theme = this.$Service('Theme');

theme.Policy('dark');        /* or 'light', or 'system' to follow the operating system */
theme.Use('soft');           /* a named theme; Use('default') goes back */
theme.Resolved();            /* 'dark': the scheme shown */
```

The policy and the theme are kept in `localStorage` and come back on the next visit. To avoid a flash of the default theme on load, the page may name its theme in its markup: `<body data-theme="soft" data-scheme="dark">`.

| Method | Meaning |
| --- | --- |
| `Policy(value)`, `Policy()` | sets or returns the policy: `system`, `light`, `dark` |
| `Next()` | the next policy (what `ThemeSwitch` does) |
| `Resolved()` | the scheme shown |
| `Register(name, {URL, Label, Schemes})` | adds a theme: its stylesheet loads when it is first used; `Schemes: ['dark']` for a theme of one scheme |
| `Use(name, callback)` | shows a theme, after loading its stylesheet; `callback(error)` |
| `Theme()`, `Themes()` | the theme shown, every theme `[{Name, Label, Schemes}]` |
| `Scope(element, name, callback)` | one part of the page in a theme or a policy of its own; `null` gives it back to the page |
| `Channels(color)` | the channels of a color (`'75, 68, 61'`) for the `-rgb` tokens |
| `OnChange(callback)`, `OffChange(callback)` | `{Policy, Theme, Name}` after every change, including a change of the system under `system` |

ElemenxUI brings `contrast` (high contrast, light and dark), `darcula` (the dark theme of the JetBrains IDEs), `soft` (round corners, roomier controls, a violet accent), and two themes for games, `fantasy` and `scifi`. A build takes a theme only when the Application names it (`Theme.Use('soft')`, `data-theme="soft"`) or lists the themes (`Theme.Themes()`); `--packs soft` adds one it cannot see.

## A theme file

Every rule of a theme starts with its attribute, written twice so it works on any element. Tokens of both schemes go under `[data-theme][data-theme='ocean']`, the colors of each scheme under `...[data-scheme='light']` and `...[data-scheme='dark']`:

```css
[data-theme][data-theme='ocean'] {
	--elemenx-radius: 6px;
	--elemenx-control: 36px;
}

[data-theme][data-theme='ocean'][data-scheme='light'] {
	--elemenx-accent: #0b6e99;
	--elemenx-accent-rgb: 11, 110, 153;
	--elemenx-background: #f1f6f8;
}

[data-theme][data-theme='ocean'][data-scheme='dark'] {
	--elemenx-accent: #6cc4e8;
	--elemenx-accent-rgb: 108, 196, 232;
	--elemenx-background: #0d1a20;
}

[data-theme][data-theme='ocean'] .elemenx-button.primary {
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
```

The prefix makes a theme apply only while it is on (its file may stay on the page), and makes its rules more specific than the rules of the components they override, so the order of the stylesheets does not matter. A token you do not set keeps its default. `libraries/ElemenxUI/themes/template.css` lists every token with its value: copy it, rename it, keep what you change. The classes of the components are public: the full list is `docs/THEMING-CLASSES.md` of the repository.

```js
theme.Register('ocean', {URL: 'themes/ocean.css', Label: 'Ocean'});
theme.Use('ocean', function (error) {});
```

## The tokens

| Group | Tokens |
| --- | --- |
| Type | `--elemenx-font`, `--elemenx-font-mono`, `--elemenx-font-math`, `--elemenx-font-size-small` / `-size` / `-size-large` (12, 14, 16px), `--elemenx-font-size-field` (16px on a touch screen), `--elemenx-line-height-small` / `-height` / `-height-large`, `--elemenx-font-weight-strong`, `--elemenx-font-weight-bold` |
| Geometry | `--elemenx-control-small` / `--elemenx-control` / `-large` / `-giant` (24, 32, 40, 56px; larger on a touch screen), `--elemenx-grid-min`, `--elemenx-radius-small` / `--elemenx-radius` / `-large` / `-huge` / `-giant` / `-pill` |
| Motion | `--elemenx-duration`, `--elemenx-duration-slow`, `--elemenx-easing` |
| Colors of a scheme | `--elemenx-background`, `--elemenx-surface`, `--elemenx-surface-raised`, `--elemenx-surface-hover`, `--elemenx-text`, `--elemenx-text-muted`, `--elemenx-accent`, `--elemenx-accent-hover`, `--elemenx-accent-text`, `--elemenx-danger`, `--elemenx-success`, `--elemenx-warning`, `--elemenx-info`, `--elemenx-border`, `--elemenx-border-strong`, `--elemenx-shadow`, `--elemenx-focus`, and their `-rgb` channels |
| Both schemes | `--elemenx-shadow-small`, `--elemenx-shadow-subtle`, `--elemenx-backdrop`, `--elemenx-overlay`, the scrollbars, the badges and avatars, the gamepad buttons |
| Components | `--elemenx-block-*`, `--elemenx-property-*`, `--elemenx-rating-color`, `--elemenx-tile-color`, `--elemenx-weather-*`, `--elemenx-syntax-*` (highlighted code), `--elemenx-achievement-*`, and the `--elemenx-game-*` tokens of the game components |

A component has variables of its own, set by its variants (`--elemenx-progress-color`, `--elemenx-drawer-size`...): a theme changes them on its class.

## A part of the page

Any element with `data-theme` and `data-scheme` gives itself and everything in it a theme of its own; `Theme.Scope(element, name)` does it from code, loading the stylesheet of a named theme first:

```html
<section data-theme="darcula" data-scheme="dark">...</section>
<aside data-scheme="dark">...</aside>
```

## Example

The block below takes a theme of its own; the rest of the page keeps yours. `ocean` is a theme made by the example from the CSS above, registered with `Elemenx.Style`:

```example
<RadioGroup Variant="segmented" [options]="Themes" [value]="Name" (change)="Pick" />
<div class="docs-themed elemenx-panel">
	<div class="elemenx-container wrappable" style="gap: 8px;">
		<Button Label="Primary" Variant="primary" />
		<Button Label="Secondary" />
		<Toggle Label="Toggle" Checked="true" />
		<Rating Value="3" />
	</div>
	<Input Placeholder="A field" />
	<Progress Value="60" />
</div>
<script>
({
	Name: 'page',
	Themes: [
		{Value: 'page', Label: 'Page'},
		{Value: 'light', Label: 'Light'},
		{Value: 'dark', Label: 'Dark'},
		{Value: 'darcula', Label: 'Darcula'},
		{Value: 'soft', Label: 'Soft'},
		{Value: 'contrast', Label: 'Contrast'},
		{Value: 'ocean', Label: 'Ocean'}
	],

	$OnCreate: function () {
		Elemenx.Style('docs-ocean', "[data-theme][data-theme='ocean'] { --elemenx-radius: 6px; } [data-theme][data-theme='ocean'][data-scheme='light'] { --elemenx-accent: #0b6e99; --elemenx-accent-rgb: 11, 110, 153; --elemenx-background: #f1f6f8; --elemenx-surface: #ffffff; } [data-theme][data-theme='ocean'][data-scheme='dark'] { --elemenx-accent: #6cc4e8; --elemenx-accent-rgb: 108, 196, 232; --elemenx-background: #0d1a20; --elemenx-surface: #132630; } [data-theme][data-theme='ocean'] .elemenx-button.primary { text-transform: uppercase; letter-spacing: 0.04em; }");

		this.$Service('Theme').Register('ocean', {Label: 'Ocean'});
	},

	Pick: function (name) {
		this.Name = name;

		this.$Service('Theme').Scope(this.$Element().querySelector('.docs-themed'), name === 'page' ? null : name);
	}
})
</script>
```
