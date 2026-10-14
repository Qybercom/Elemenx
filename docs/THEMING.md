# Theming ElemenxUI

A theme of ElemenxUI is one plain CSS file. It changes the tokens of the theme (the `--elemenx-*` variables: colors, corners, sizes, type, motion) and, where tokens are not enough, the rules of any Component, by its classes. There are no build steps and no cascade layers: the file works in every browser that runs ElemenxUI.

## The page

`body` carries two attributes, set by the `Theme` Service:

- `data-theme`: the policy of the color scheme under the default theme (`system`, `light` or `dark`; `index.css` applies it before any script runs), or the name of a named theme (`contrast`, `ocean`...).
- `data-scheme`: the scheme shown, `light` or `dark`, whatever the theme.

`Theme.Policy('dark')` chooses the scheme, `Theme.Use('ocean')` the theme; both are remembered in `localStorage`. A theme made for one scheme only (`Schemes: ['dark']`) always shows that scheme.

## A theme file

Every rule of a theme starts with the attribute of the theme. Tokens that do not depend on the scheme go under `body[data-theme='ocean']`, the colors of each scheme under `body[data-theme='ocean'][data-scheme='light']` and `body[data-theme='ocean'][data-scheme='dark']`:

```css
body[data-theme='ocean'] {
	--elemenx-radius: 6px;
	--elemenx-control: 36px;
}

body[data-theme='ocean'][data-scheme='light'] {
	--elemenx-accent: #0b6e99;
	--elemenx-background: #f1f6f8;
}

body[data-theme='ocean'][data-scheme='dark'] {
	--elemenx-accent: #6cc4e8;
	--elemenx-background: #0d1a20;
}

body[data-theme='ocean'] .elemenx-button.primary {
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
```

The prefix does three things. The theme applies only while it is on, so its file may stay on the page. A prefixed rule is more specific than the rule of the Component it overrides (copy the selector of the Component and put the prefix before it), so the theme wins whatever the order of the stylesheets, including the styles that Components add when they first show. And the colors of a scheme block win over the colors of `index.css` for that scheme. A token you do not set keeps its default.

`libraries/ElemenxUI/themes/template.css` has every token with its default value: copy it, rename `my-theme`, keep what you change. `docs/THEMING-CLASSES.md` lists every class of the Library with its modifier classes; the classes are public API, so a theme written against them keeps working.

## Using a theme

```js
var theme = this.$Service('Theme');

theme.Register('ocean', {URL: 'themes/ocean.css', Label: 'Ocean'});
theme.Use('ocean', function (error) {
	/* The stylesheet is loaded and the theme is shown, or error says why not. */
});
```

With a `URL`, the stylesheet loads when the theme is first used, and the Service keeps it after the other stylesheets of the head. Without one, the stylesheet is already on the page: an `index.js` of the Application lists it, or the page links it. `Use('default')` goes back to `index.css`. `Themes()` lists the themes (`[{Name, Label, Schemes}]`), `Theme()` names the one shown, and `OnChange` reports `{Policy, Theme, Name}`. A remembered theme of the Application shows as soon as the Application registers it. To avoid a flash of the default theme on load, the page may name its theme in its markup: `<body data-theme="ocean" data-scheme="dark">`.

The Library brings three themes, loaded with it and shown on `Use`:

- `contrast`: high contrast, black on white and white on black, strong borders and a solid focus ring; light and dark.
- `darcula`: the dark theme of the JetBrains IDEs; dark only.
- `soft`: round corners, roomier controls, a violet accent and softer motion; light and dark.

## Tokens

The tokens of geometry, type and motion, and the colors that are the same in both schemes, are defined on `:root` (the scrollbars of the page read them there). The colors of a scheme are defined on `body`, with their dark values under `body[data-scheme='dark']`.

Type:

- `--elemenx-font`: the font of the interface. `--elemenx-font-mono`: code, the terminal.
- `--elemenx-font-size-small`, `--elemenx-font-size`, `--elemenx-font-size-large`: 12, 14 and 16px.
- `--elemenx-line-height-small`, `--elemenx-line-height`, `--elemenx-line-height-large`: 16, 20 and 24px.
- `--elemenx-font-weight-strong` (600: labels, headers) and `--elemenx-font-weight-bold` (700: badges, numbers).

Geometry:

- `--elemenx-control-small`, `--elemenx-control`, `--elemenx-control-large`, `--elemenx-control-giant`: the heights of buttons, fields, tabs, sliders and options, 24, 32, 40 and 56px. Change them together to make an Application more compact or roomier.
- `--elemenx-radius-small` (2px), `--elemenx-radius` (4px: controls), `--elemenx-radius-large` (8px: cards, panels, menus), `--elemenx-radius-huge` (12px: the command palette, a tour, a drawer), `--elemenx-radius-giant` (16px: chat bubbles), `--elemenx-radius-pill` (999px: pills and badges).

Motion:

- `--elemenx-duration` (120ms: hover, press), `--elemenx-duration-slow` (200ms: panels that slide), `--elemenx-easing`.

Colors of a scheme:

- `--elemenx-background`: the page. `--elemenx-surface`: controls and panels. `--elemenx-surface-raised`: headers, sidebars, raised blocks. `--elemenx-surface-hover`: a hovered row or button.
- `--elemenx-text`, `--elemenx-text-muted`: text and secondary text.
- `--elemenx-accent`, `--elemenx-accent-hover`, `--elemenx-accent-text`: primary buttons, selection, current items, and the text on them.
- `--elemenx-danger`, `--elemenx-success`, `--elemenx-warning`, `--elemenx-info`: the variants of buttons, badges, callouts, toasts, progress.
- `--elemenx-border`, `--elemenx-border-strong`: borders, and the borders of hovered or emphasized controls.
- `--elemenx-shadow`: menus, popovers, dialogs.
- `--elemenx-focus`: the focus ring (by default the accent at 48%).
- `--elemenx-rating-color`: the stars of `Rating`. `--elemenx-tile-color`: a `Tile` without a color of its own.
- `--elemenx-weather-sun`, `--elemenx-weather-moon`, `--elemenx-weather-cloud`, `--elemenx-weather-rain`, `--elemenx-weather-snow`, `--elemenx-weather-bolt`, `--elemenx-weather-wind`, `--elemenx-weather-fog`, `--elemenx-weather-thermometer`: the parts of a weather icon with `Colored="true"`.

Colors of both schemes:

- `--elemenx-shadow-small`: the thumb of a slider or a toggle, an event of the calendar. `--elemenx-shadow-subtle`: a card on the page.
- `--elemenx-backdrop`: behind a dialog, a drawer, the command palette, a tour.
- `--elemenx-overlay`, `--elemenx-overlay-soft`, `--elemenx-overlay-text`: on images and colored tiles (the caption of an uploaded image, the badge of a tile).
- `--elemenx-hairline`: the edge of a color swatch.
- `--elemenx-scrollbar`, `--elemenx-scrollbar-hover`, `--elemenx-scrollbar-active`, `--elemenx-scrollbar-track`: the scrollbars. The scrollbars of the page itself read the tokens of `:root`; a theme changes them there with `:root:has(body[data-theme='ocean'])` where `:has` is supported.

Components also have their own variables, set by their variants (`--elemenx-progress-color`, `--elemenx-step-size`, `--elemenx-drawer-size`...): a theme changes them on the class of the Component, `body[data-theme='ocean'] .elemenx-progress { --elemenx-progress-color: ...; }`.

`tests/regression/theming.test.js` keeps the Library themable: the stylesheets of the Components name no color, round no corner and time no transition other than through tokens, every token is in the template and here, every rule of a Library theme starts with its attribute, and `THEMING-CLASSES.md` matches the classes of the stylesheets.

## Browsers

Themes use CSS custom properties and attribute selectors, nothing else. The focus ring and a few tints of the Components mix colors with `color-mix()` (Chrome 111, Safari 16.2, Firefox 113); a theme may set `--elemenx-focus` to a plain color.
