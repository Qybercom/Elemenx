# Languages

`Elemenx.Locale` keeps the phrases of the Applications and of their libraries in the language of the page. Templates show them with `$T(key, params)`, and when the language changes, every phrase on the page follows, with the `lang` and `dir` of the document.

The dictionaries are JSON files, one for each language; nested objects make keys with dots:

```json
{
	"cart": {
		"title": "Cart",
		"total": "Total: {sum}",
		"items": {"one": "{count} item", "other": "{count} items"}
	}
}
```

```js
Elemenx.Application('Shop', {
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru', 'de']}
});
```

```html
<h2>{{$T('cart.title')}}</h2>
<p>{{$T('cart.items', {count: Items.length})}} · {{$T('cart.total', {sum: Total})}}</p>
```

The root of an Application renders once the dictionaries of the language are in, so the first screen shows its phrases, not their keys.

## The language

| Method | Meaning |
| --- | --- |
| `Language()` | the language of the page (`'en'`, `'pt-br'`...) |
| `Language(code, callback)` | loads the dictionaries of that language, then switches to it and calls back `(error)`; the `lang` and `dir` of the page follow |
| `Fallback(code)` | the language of the phrases a dictionary lacks, `'en'` by default; `Fallback()` returns it |
| `Direction(code)` | `'ltr'` or `'rtl'` (Arabic, Hebrew, Persian, Urdu...) |
| `OnChange(callback)`, `OffChange(callback)` | the language changed |

The first language is the `lang` of the page, or the language of the browser.

## Phrases

| Method | Meaning |
| --- | --- |
| `Text(key, params)` | the phrase of the key: in the language, else its base language (`pt` for `pt-BR`), else the fallback language, else the key itself; `{name}` is replaced by `params.name` |
| `Has(key)` | whether a phrase of that key exists |
| `Add(language, entries)` | adds phrases in code: `Add('de', {cart: {title: 'Warenkorb'}})` |
| `Source(url, languages)` | names dictionary files: `'/locales/{language}.json'`, only for the languages listed when a list is given |
| `Key(event)` | the key of a keyboard event, with `ArrowLeft` and `ArrowRight` swapped on a right-to-left element: code written for left to right keeps its meaning |

A phrase that is an object of plural forms (`zero`, `one`, `two`, `few`, `many`, `other`) is chosen by `params.count` through `Intl.PluralRules` of the language: Russian has `one` (1, 21), `few` (2–4, 22–24) and `many` (5–20), English `one` and `other`.

`$T` in a template follows the language: a template that shows a phrase is updated when the language changes, with nothing else to do. A component that needs a phrase in code calls `Elemenx.Locale.Text(key, params)`, and listens to `OnChange` if it keeps the result.

## Libraries

A library declares its dictionaries in its own `$Locales` (relative to its root). ElemenxUI speaks English and Russian: every label, placeholder and message of its components is a key under `ui.` (`ui.common.clear`), and an Application may add another language (`Add('de', {ui: {...}})`) or change a phrase. The dates, numbers, countries and currencies of the components follow the language too, and a right-to-left language mirrors them (see [ElemenxUI](/guide/library)).

## This reference

The pages of this reference are Markdown files of each language: `pages/guide/start.en.md`, `pages/guide/start.ru.md`; a page missing in a language shows its English one with a note. The buttons of its header call `Elemenx.Locale.Language`, and the language is kept in `localStorage` for the next visit.

## Example

The phrases of the example are added in code, in English and in Russian; the plural form follows the count in the language of this page:

```example
<Slider [value]="Count" Min="0" Max="30" ShowValue="always" (input)="Counted" />
<p><strong>{{$T('docs.example.items', {count: Count})}}</strong></p>
<p class="elemenx-text small muted">{{$T('docs.example.language', {language: $T('docs.example.name')})}} · {{Direction}}</p>
<script>
({
	Count: 3,
	Direction: 'Arabic is written ' + Elemenx.Locale.Direction('ar') + ', Russian ' + Elemenx.Locale.Direction('ru'),

	$OnCreate: function () {
		Elemenx.Locale.Add('en', {docs: {example: {
			items: {one: '{count} file', other: '{count} files'},
			language: 'The language of the page: {language}',
			name: 'English'
		}}});

		Elemenx.Locale.Add('ru', {docs: {example: {
			items: {one: '{count} файл', few: '{count} файла', many: '{count} файлов', other: '{count} файла'},
			language: 'Язык страницы: {language}',
			name: 'русский'
		}}});
	},

	Counted: function (value) {
		this.Count = value;
	}
})
</script>
```

Switch the language in the header of this reference: the phrases of the example follow.
