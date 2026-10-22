<!-- generated -->
# Стили и shadow DOM

Компонент носит свой CSS с собой: `$Style` держит его текстом, `$StyleURL` называет файл рядом со скриптом. Таблица стилей ставится один раз, когда отрисовывается первый экземпляр компонента, и остаётся для следующих; производственная сборка встраивает файл. Правила — обычный CSS страницы: называйте классы компонента по нему (`.product-card`, `.product-card-title`), чтобы они не пересекались с другими.

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

Цвета, скругления, размеры и длительности ElemenxUI — токены темы (`--elemenx-accent`, `--elemenx-radius`...): компонент, который их использует, следует за каждой темой и обеими схемами (см. [Темы](/guide/theming)).

## Стили из кода

`Elemenx.Style(name, text)` держит в документе таблицу стилей с этим именем: новый текст заменяет старый, пустой — удаляет. Так же идут таблицы стилей компонентов и библиотек, поэтому каждое приложение в shadow root тоже их получает.

```js
Elemenx.Style('print', '@media print { .no-print { display: none; } }');
```

## Привязки стилей

В шаблоне `[class]`, `[class.name]`, `[style]` и `[style.property]` меняют классы и стили вместе с состоянием (см. [Шаблоны](/guide/templates)); `[style.--size]="Size + 'px'"` задаёт пользовательское свойство, которое читает CSS компонента.

## Приложение в shadow root

`$Shadow` (`true`, `'open'` или `'closed'`) отрисовывает корень приложения в shadow root его элемента монтирования:

```js
Elemenx.Application('Widget', {$Component: 'WidgetRoot', $Mount: '#widget', $Shadow: true, $Use: ['ElemenxUI']});
```

- Стили страницы не доходят до приложения, а его стили — до страницы.
- `Elemenx.Style` ставит каждую таблицу стилей фреймворка, его компонентов и библиотек и в этот shadow root. В shadow root `html`, `body` и `:root` в селекторе означают его хост: `body[data-theme='dark'] .card` становится `:host([data-theme='dark']) .card`, поэтому темы ElemenxUI работают и там.
- Ссылки приложения проходят через его маршрутизатор; его хост получает `lang` и `dir` из `Elemenx.Locale`.
- Сборка-виджет по умолчанию отрисовывается в shadow root (`$Shadow: false` это выключает).

## Страница и её части

ElemenxUI стилизует `html` и `body` (шрифт, фон темы, полосы прокрутки) и даёт классы раскладки: `elemenx-screen` (всё окно), `elemenx-container` (строка; `fill`, `centered`, `wrappable`, `grid`...), `elemenx-column` (столбец), типографику (`elemenx-title`, `elemenx-text`, `elemenx-caption`...), блоки (`elemenx-panel`, `elemenx-card`, `elemenx-callout`...) и таблицы. Все классы перечислены в списке [THEMING-CLASSES](https://github.com/Qybercom/Elemenx/blob/main/docs/THEMING-CLASSES.md) репозитория; они публичны: тема, написанная по ним, продолжает работать.

## Пример

Компонент, объявленный примером, со своей таблицей стилей; его размер — пользовательское свойство, привязанное к состоянию:

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
