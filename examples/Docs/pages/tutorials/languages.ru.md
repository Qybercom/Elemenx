<!-- generated -->
# Приложение на нескольких языках

Отель для бронирования на английском, русском и арабском: каждая фраза из словаря, формы множественного числа каждого языка, даты и цены в его манере и страница, которая зеркалится для языка, пишущегося справа налево. Готовый проект — `examples/Tutorials/Languages`.

Чему вы научитесь: словари и `$T`, формы множественного числа, `Intl` для дат и денег, переключение языка и его запоминание, раскладка справа налево через логический CSS и клавиши, сохраняющие смысл в обоих направлениях.

## 1. Словари

По одному JSON-файлу на язык в `locales/`. Вложенные объекты дают ключи с точками (`trip.photos.room`); `{name}` — параметр:

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

Приложение называет их и языки, которые у него есть:

```js
Elemenx.Application('Languages', {
	$Component: 'TripCard',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru', 'ar']}
});
```

Оно стартует на языке, выбранном раньше, иначе на языке системы, если он есть, иначе на `lang` страницы; его корень отрисовывается, когда словарь загружен, поэтому первый экран показывает фразы, а не ключи. `elemenx build` забирает словари в сборку.

## 2. Фразы в шаблоне

```html
<h1 class="elemenx-title">{{$T('trip.title')}}</h1>
<p class="trip-nights">{{$T('trip.nights', {count: Nights})}}</p>
```

`$T` следует за языком: когда он меняется, вместе с ним меняются все фразы страницы. Пишите целые фразы с параметрами, а не куски, склеенные в коде: порядок слов в языках разный (`Total: {sum}` — это `المجموع: {sum}`, а другой язык ставит сумму первой).

## 3. Формы множественного числа

Фраза-объект с формами выбирается по `count` через `Intl.PluralRules` языка. В английском две формы, в русском три, в арабском шесть:

```json
"nights": {"one": "{count} ночь", "few": "{count} ночи", "many": "{count} ночей", "other": "{count} ночи"}
```

```json
"nights": {"zero": "لا ليالٍ", "one": "ليلة واحدة", "two": "ليلتان", "few": "{count} ليالٍ", "many": "{count} ليلة", "other": "{count} ليلة"}
```

`1 ночь`, `3 ночи`, `5 ночей`, `21 ночь`: правила это знают; никогда не пишите `count === 1 ? ... : ...`.

## 4. Даты и деньги

Даты, числа и валюты — не фразы: `Intl` пишет их в манере языка.

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

`July 14`, `14 июля` и `€252.00`, `252,00 €`. Шаблон передаёт этим методам `Language` (`Dates(Nights, Language)`): текст, написанный в коде, — не `$T`, поэтому компонент хранит язык в своём состоянии, обновляя его из `Elemenx.Locale.OnChange`, и выражение следует за ним. Сервис `Format` из ElemenxUI (`Money`, `Date`, `Relative`) следует за языком сам.

## 5. Выбор языка

```js
Switched: function (value) {
	Elemenx.Locale.Language(value, function () {});
}
```

`Language(code, callback)` загружает словари языка, переключается, ставит `lang` и `dir` страницы и запоминает выбор до следующего визита. Называйте каждый язык на нём самом (`Русский`, `العربية`): человек, не читающий по-английски, должен найти свой.

## 6. Справа налево

Для арабского, иврита, персидского или урду страница получает `dir="rtl"`, и браузер раскладывает текст и поток блоков справа. Помогите ему логическим CSS: `inline` и `block` вместо ширины и высоты, `start` и `end` вместо left и right:

```css
.trip {
	max-inline-size: 520px;
	margin-block: 40px;
	margin-inline: auto;
	padding-inline: 16px;
}
```

Правило с `margin-left` в арабском останется слева; `margin-inline-start` само переходит вправо. Компоненты ElemenxUI уже написаны так.

Картинки, означающие направление (стрелка, «дальше»), зеркалятся правилом; не означающие (часы, галочка, логотип) — нет:

```css
[dir='rtl'] .trip-arrow svg {
	transform: scaleX(-1);
}
```

## 7. Клавиши в обоих направлениях

ArrowRight значит «дальше» по-английски и «назад» по-арабски, где чтение идёт влево. `Elemenx.Locale.Key(event)` меняет местами две стрелки на элементе с раскладкой справа налево, поэтому код пишется один раз:

```js
Stepped: function (event) {
	var key = Elemenx.Locale.Key(event);

	if (key === 'ArrowRight') this.Next();
	else if (key === 'ArrowLeft') this.Previous();
}
```

## 8. Фразы ElemenxUI

ElemenxUI говорит по-английски и по-русски. На другом языке его компоненты переходят на английский, пока вы не добавите их фразы: `Elemenx.Locale.Add('ar', {ui: {select: {placeholder: 'اختر'}}})` или свой файл с ключами `libraries/ElemenxUI/locales/en.json`.

## 9. Попробуйте

```bash
cd examples/Tutorials/Languages
npm install
npm run dev
```

Двигайте ползунок на каждом языке и смотрите на формы слова «ночь»; переключитесь на арабский, нажимайте стрелки на фото и перезагрузите страницу: она помнит язык.
