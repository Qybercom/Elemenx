# An application in several languages

A hotel to book in English, Russian and Arabic: every phrase from a dictionary, the plural forms of each language, dates and prices written in its manner, and a page that mirrors itself for a language written right to left. The finished project is `examples/Tutorials/Languages`.

What you learn: dictionaries and `$T`, plural forms, `Intl` for dates and money, switching the language and remembering it, right-to-left layout with logical CSS, and keys that keep their meaning in both directions.

## 1. The dictionaries

One JSON file for each language, in `locales/`. Nested objects make keys with dots (`trip.photos.room`); `{name}` is a parameter:

```json
{
	"trip": {
		"title": "Seaside",
		"dates": "{from} – {to}",
		"nights": {"one": "{count} night", "other": "{count} nights"},
		"total": "Total: {sum}"
	}
}
```

The Application names them, and the languages it has:

```js
Elemenx.Application('Languages', {
	$Component: 'TripCard',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru', 'ar']}
});
```

It starts in the language chosen before, else in the language of the system if it has it, else in the `lang` of the page; its root renders once the dictionary is in, so the first screen shows phrases, never keys. `elemenx build` takes the dictionaries into the build.

## 2. Phrases in the template

```html
<h1 class="elemenx-title">{{$T('trip.title')}}</h1>
<p class="trip-nights">{{$T('trip.nights', {count: Nights})}}</p>
```

`$T` follows the language: when it changes, every phrase of the page changes with it. Write whole phrases with parameters, never pieces glued in code: the order of the words differs between languages (`Total: {sum}` is `المجموع: {sum}`, and another language puts the sum first).

## 3. Plural forms

A phrase that is an object of forms is chosen by `count`, through `Intl.PluralRules` of the language. English has two forms; Russian three; Arabic six:

```json
"nights": {"one": "{count} ночь", "few": "{count} ночи", "many": "{count} ночей", "other": "{count} ночи"}
```

```json
"nights": {"zero": "لا ليالٍ", "one": "ليلة واحدة", "two": "ليلتان", "few": "{count} ليالٍ", "many": "{count} ليلة", "other": "{count} ليلة"}
```

`1 ночь`, `3 ночи`, `5 ночей`, `21 ночь`: the rules know them; never write `count === 1 ? ... : ...`.

## 4. Dates and money

Dates, numbers and currencies are not phrases: `Intl` writes them in the manner of the language.

```js
Dates: function (nights, language) {
	var format = new Intl.DateTimeFormat(language, {day: 'numeric', month: 'long'});
	var from = new Date(this.Arrival + 'T12:00:00');
	var to = new Date(from.getTime() + nights * 86400000);

	return Elemenx.Locale.Text('trip.dates', {from: format.format(from), to: format.format(to)});
},

Money: function (amount, language) {
	return new Intl.NumberFormat(language, {style: 'currency', currency: 'EUR'}).format(amount);
}
```

`July 14`, `14 июля`, and `€252.00`, `252,00 €`. The template passes `Language` to these methods (`Dates(Nights, Language)`): a text written in code is not a `$T`, so the component keeps the language in its state, set by `Elemenx.Locale.OnChange`, and the expression follows it. The `Format` Service of ElemenxUI (`Money`, `Date`, `Relative`) follows the language by itself.

## 5. Choosing the language

```js
Switched: function (value) {
	Elemenx.Locale.Language(value, function () {});
}
```

`Language(code, callback)` loads the dictionaries of the language, switches, sets `lang` and `dir` of the page, and remembers the choice for the next visit. Name each language in itself (`Русский`, `العربية`): a person who does not read English must find their own.

## 6. Right to left

For Arabic, Hebrew, Persian or Urdu the page gets `dir="rtl"`, and the browser lays the text and the flow of the boxes from the right. Help it with logical CSS: `inline` and `block` instead of width and height, `start` and `end` instead of left and right:

```css
.trip {
	max-inline-size: 520px;
	margin-block: 40px;
	margin-inline: auto;
	padding-inline: 16px;
}
```

A rule with `margin-left` stays on the left in Arabic; `margin-inline-start` goes to the right by itself. The components of ElemenxUI are written so already.

Pictures that mean a direction (an arrow, a "next") are mirrored by a rule; pictures that do not (a clock, a check mark, a logo) are not:

```css
[dir='rtl'] .trip-arrow svg {
	transform: scaleX(-1);
}
```

## 7. Keys in both directions

ArrowRight means "next" in English, and "back" in Arabic, where the reading goes to the left. `Elemenx.Locale.Key(event)` swaps the two arrows on an element laid out right to left, so the code is written once:

```js
Stepped: function (event) {
	var key = Elemenx.Locale.Key(event);

	if (key === 'ArrowRight') this.Next();
	else if (key === 'ArrowLeft') this.Previous();
}
```

## 8. The phrases of ElemenxUI

ElemenxUI speaks English and Russian. In another language its components fall back to English until you add its phrases: `Elemenx.Locale.Add('ar', {ui: {select: {placeholder: 'اختر'}}})`, or a file of your own with the keys of `libraries/ElemenxUI/locales/en.json`.

## 9. Try it

```bash
cd examples/Tutorials/Languages
npm install
npm run dev
```

Move the slider in each language and watch the forms of the nights; switch to Arabic, use the arrow keys on the photo, and reload: the page remembers the language.
