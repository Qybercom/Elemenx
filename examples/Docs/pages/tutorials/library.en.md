# A library of your own

Acme, a small library of components a company shares between its applications: a card for a number that matters, a price, a text to copy. With its own service, its phrases in two languages, its design tokens built on those of ElemenxUI, and a showcase that writes its reference from what the components declare. The finished project is `examples/Tutorials/Kit`.

What you learn: the layout of a library, declaring it and using it, components that use a service of their library, phrases and tokens of a library, `$Meta` and `Elemenx.Meta`, and what a build takes of a library.

## 1. The layout

```text
Kit/
├── app.js                      Elemenx.Library('Acme', ...) and the Application
├── index.html
├── Kit/                        the Application: its showcase
└── libraries/Acme/
    ├── index.js                ['index.css', 'services', 'components']
    ├── index.css               the tokens of Acme
    ├── locales/en.json, ru.json
    ├── services/               index.js, Prices.js
    └── components/             index.js, StatCard/, PriceTag/, CopyField/
```

A library is laid out as an Application: `index.js` files list what is there, in order; a folder named in a list has an `index.js` of its own. Each component is a folder with its `.js`, `.html` and `.css`.

## 2. Declaring it

```js
Elemenx.Library('Acme', {
	$Root: 'libraries/Acme',
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}
});

Elemenx.Application('Kit', {
	$Component: 'Showcase',
	$Root: 'Kit',
	$Use: ['ElemenxUI', 'Acme']
});
```

`$Use` names the libraries of the Application. A tag it does not know (`<StatCard>`) is looked for in them; their services load before the root starts, and the CSS their `index.js` lists is attached once. To share it between projects, publish the folder as a package and give `$Root` its path.

## 3. Components that use their library

`PriceTag` writes its prices through `Prices`, a service of the same library:

```js
Price: function (amount, currency) {
	return this.$Service('Prices').Format(amount, currency);
}
```

A component of a library is written as any other. Give its classes the name of the library (`acme-price`, `acme-stat`): the styles of a library meet those of every application that uses it, and a short name like `.price` would collide.

## 4. Phrases

The texts of the components are keys of the library, never words in the templates:

```html
<button type="button" class="acme-copy-button" (click)="Copy">{{Copied ? $T('acme.copy.done') : $T('acme.copy.action')}}</button>
```

`locales/en.json` and `ru.json` hold them under the name of the library (`acme.copy.action`), so they never meet the keys of an application. An application may change a phrase or add a language: `Elemenx.Locale.Add('de', {acme: {copy: {action: 'Kopieren'}}})`.

## 5. Tokens

```css
:root {
	--acme-brand: var(--elemenx-accent);
	--acme-surface: var(--elemenx-surface);
	--acme-line: var(--elemenx-border);
	--acme-good: var(--elemenx-success);
	--acme-bad: var(--elemenx-danger);
	--acme-radius: var(--elemenx-radius);
}
```

The components use only `--acme-*`. Built on the tokens of ElemenxUI, they follow its light and dark schemes and its themes for nothing; a product changes its brand in one line (`:root { --acme-brand: #7c3aed; }`), and no color is written twice.

## 6. What a component declares

```js
$Meta: {
	Group: 'data',
	Icon: 'tag',
	Description: 'A price, with the old one struck through and the discount.',
	Props: {
		Amount: {Type: 'number', Description: 'The price.'},
		Currency: {Options: ['EUR', 'USD', 'GBP', 'RUB'], Description: 'Its currency.'},
		Old: {Type: 'number', Description: 'The price before, struck through.'},
		Size: {Options: ['small', 'medium', 'large'], Description: 'Its size.'}
	},
	Sample: {Amount: 79, Old: 99, Currency: 'EUR'}
}
```

`$Meta` tells tools what a component is: its group and icon in a palette, its public props (a type, or the options of a list), its events, a sample to show. It is never state. `Elemenx.Meta(name)` returns it normalized, with the default value of each prop read from the definition:

```js
this.Metas = this.Names.map(function (name) {
	return Elemenx.Meta(name);
});
```

The showcase of the project makes its reference of it: a table of the props of each component, its events, written once, beside the code that they describe. The UI Builder of Elemenx reads the same `$Meta` to put the components of a library in its palette and its inspector.

## 7. The build

A build takes of a library only the components the Application renders, by their tags in its templates and then in theirs; the rest is left out. The `$Meta` is left out too, unless the Application reads it (`Elemenx.Meta` in its code, or the Designer), as the showcase does: then it stays.

## 8. Try it

```bash
cd examples/Tutorials/Kit
npm install
npm run dev
```

Add a prop to `StatCard` and to its `$Meta`: the reference of the showcase shows it at the next reload.
