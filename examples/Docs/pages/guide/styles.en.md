# Styles and shadow DOM

A component carries its CSS with it: `$Style` holds it as a text, `$StyleURL` names a file next to its script. The stylesheet is placed once, when the first instance of the component renders, and stays for the next ones; a production build inlines the file. The rules are plain CSS of the page: name the classes of a component after it (`.product-card`, `.product-card-title`) so they do not meet others.

```js
Elemenx.Component('ProductCard', {
	$TemplateURL: 'ProductCard.html',
	$StyleURL: 'ProductCard.css'
});

Elemenx.Component('Badge', {
	$Template: '<span class="badge">{{Text}}</span>',
	$Style: '.badge { padding: 0 6px; border-radius: 999px; background: var(--elemenx-accent); color: var(--elemenx-accent-text); }',
	Text: ''
});
```

The colors, corners, sizes and timings of ElemenxUI are tokens of the theme (`--elemenx-accent`, `--elemenx-radius`...): a component that uses them follows every theme and both schemes (see [Themes](/guide/theming)).

## Styles from code

`Elemenx.Style(name, text)` keeps a stylesheet of a name in the document: a new text replaces the old one, an empty one removes it. The stylesheets of components and libraries go the same way, so every Application in a shadow root gets them too.

```js
Elemenx.Style('print', '@media print { .no-print { display: none; } }');
```

## Bindings of style

In a template, `[class]`, `[class.name]`, `[style]` and `[style.property]` change classes and styles with the state (see [Templates](/guide/templates)); `[style.--size]="Size + 'px'"` sets a custom property that the CSS of the component reads.

## An Application in a shadow root

`$Shadow` (`true`, `'open'` or `'closed'`) renders the root of an Application in a shadow root of its mount:

```js
Elemenx.Application('Widget', {$Component: 'WidgetRoot', $Mount: '#widget', $Shadow: true, $Use: ['ElemenxUI']});
```

- The styles of the page do not reach the Application, and its styles do not reach the page.
- `Elemenx.Style` places every stylesheet of the framework, of its components and of its libraries in that shadow root too. In a shadow root, `html`, `body` and `:root` of a selector mean its host: `body[data-theme='dark'] .card` becomes `:host([data-theme='dark']) .card`, so the themes of ElemenxUI work there.
- The links of the Application go through its router; its host takes the `lang` and `dir` of `Elemenx.Locale`.
- A widget build renders in a shadow root by default (`$Shadow: false` turns it off).

## The page and its parts

ElemenxUI styles `html` and `body` (the font, the background of the theme, the scrollbars) and gives layout classes: `elemenx-screen` (a full window), `elemenx-container` (a row; `fill`, `centered`, `wrappable`, `grid`...), `elemenx-column` (a column), typography (`elemenx-title`, `elemenx-text`, `elemenx-caption`...), blocks (`elemenx-panel`, `elemenx-card`, `elemenx-callout`...) and tables. Every class is listed in the [THEMING-CLASSES](https://github.com/Qybercom/Elemenx/blob/main/docs/THEMING-CLASSES.md) list of the repository; they are public: a theme written against them keeps working.

## Example

A component declared by the example with a stylesheet of its own; its size is a custom property bound to the state:

```example
<Slider [value]="Size" Min="16" Max="64" ShowValue="always" (input)="Sized" />
<div class="elemenx-container wrappable" style="gap: 8px;">
	<DocsDot Label="A" [size]="Size" />
	<DocsDot Label="B" [size]="Size" />
	<DocsDot Label="C" [size]="Size" />
</div>
<script>
/* The component is declared before the template that names it is compiled. */
(function () {
	if (!window.ElemenxDocsDot) {
		window.ElemenxDocsDot = true;

		Elemenx.Component('DocsDot', {
			$Template: '<span class="docs-dot" [style.--docs-dot]="Size + \'px\'">{{Label}}</span>',
			$Style: '.docs-dot { display: inline-flex; align-items: center; justify-content: center; width: var(--docs-dot); height: var(--docs-dot); border-radius: 50%; background: var(--elemenx-accent); color: var(--elemenx-accent-text); font-weight: var(--elemenx-font-weight-bold); transition: width var(--elemenx-duration), height var(--elemenx-duration); }',
			Label: '',
			Size: 32
		});
	}

	return {
		Size: 32,

		Sized: function (value) {
			this.Size = value;
		}
	};
})()
</script>
```
